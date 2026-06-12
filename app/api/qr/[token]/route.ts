import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const session = await getSession();
    const token = params.token;

    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken: token },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true } },
            medicalInfo: true,
            passengers: true
          }
        },
        vehicle: true
      }
    });

    if (!qrCode) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
    }

    if (!qrCode.isActive) {
      return NextResponse.json({ 
        error: "QR code is no longer active. Please contact vehicle owner or emergency authority." 
      }, { status: 403 });
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Access Restricted", message: "Authorized EMS & Police Personnel Only" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    // Log the scan
    await prisma.auditLog.create({
      data: {
        userId,
        role,
        action: "SCANNED_QR",
        entityType: "QRCode",
        entityId: qrCode.id,
        details: `Scanned token: ${token}`
      }
    });

    if (role === "CITIZEN" || role === "HOSPITAL") {
      return NextResponse.json({ error: "Access Denied", message: "Your role does not permit access to this QR data directly." }, { status: 403 });
    }

    if (role === "EMS") {
      return NextResponse.json({
        success: true,
        data: {
          citizenDetails: qrCode.citizen.user,
          profileDetails: {
            age: qrCode.citizen.age,
            gender: qrCode.citizen.gender,
            bloodGroup: qrCode.citizen.bloodGroup,
            emergencyContactName: qrCode.citizen.emergencyContactName,
            emergencyContactPhone: qrCode.citizen.emergencyContactPhone
          },
          vehicle: qrCode.vehicle,
          passengers: qrCode.citizen.passengers,
          medicalInfo: qrCode.citizen.medicalInfo
        }
      });
    }

    if (role === "POLICE") {
      return NextResponse.json({
        success: true,
        data: {
          citizenDetails: { fullName: qrCode.citizen.user.fullName },
          vehicle: qrCode.vehicle,
          passengers: qrCode.citizen.passengers.map(p => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
            relationship: p.relationship
          }))
          // Police does not see detailed medical history
        }
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });

  } catch (error) {
    console.error("QR Scan Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
