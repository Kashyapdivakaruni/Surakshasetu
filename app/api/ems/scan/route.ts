import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, location } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Extract token if it's a full URL
    let secureToken = token;
    if (token.includes("/")) {
      const parts = token.split("/");
      secureToken = parts[parts.length - 1];
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken: secureToken },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true, profilePhoto: true } },
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
      return NextResponse.json({ error: "QR code is inactive or revoked." }, { status: 403 });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        role: "EMS",
        action: "QR_SCAN",
        entityType: "QRCode",
        entityId: qrCode.id,
        details: `Scanned Vehicle: ${qrCode.vehicle.vehicleNumber}, Location: ${location?.address || "Unknown"}`
      }
    });

    // Check if there is already an active case for this QR
    const existingCase = await prisma.accidentCase.findFirst({
      where: { 
        qrCodeId: qrCode.id,
        status: { in: ["ACTIVE", "EN_ROUTE", "HOSPITAL_NOTIFIED", "ADMITTED", "UNDER_TREATMENT"] }
      }
    });

    return NextResponse.json({
      success: true,
      qrCode,
      citizenDetails: qrCode.citizen.user,
      profileDetails: {
        age: qrCode.citizen.age,
        gender: qrCode.citizen.gender,
        bloodGroup: qrCode.citizen.bloodGroup,
        emergencyContactName: qrCode.citizen.emergencyContactName,
        emergencyContactPhone: qrCode.citizen.emergencyContactPhone
      },
      medicalInfo: qrCode.citizen.medicalInfo,
      passengers: qrCode.citizen.passengers,
      vehicle: qrCode.vehicle,
      existingCase
    });

  } catch (error) {
    console.error("EMS Scan API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
