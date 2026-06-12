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

    const { 
      qrCodeId, citizenId, vehicleId, 
      accidentLatitude, accidentLongitude, accidentAddress, 
      severityLevel, identityStatus,
      manualPatientName, manualPatientAge, manualPatientGender,
      passengersData
    } = await req.json();

    if (identityStatus === "UNVERIFIED" && !qrCodeId) {
      // Unknown patient (no QR)
      // Allow case creation
    } else if (!qrCodeId || !citizenId || !vehicleId) {
      return NextResponse.json({ error: "Missing required QR fields" }, { status: 400 });
    }

    // Create the case
    const newCase = await prisma.accidentCase.create({
      data: {
        qrCodeId: qrCodeId || null,
        citizenId: citizenId || null,
        vehicleId: vehicleId || null,
        scannedByEmsId: session.user.id,
        accidentLatitude: accidentLatitude || null,
        accidentLongitude: accidentLongitude || null,
        accidentAddress: accidentAddress || "Unknown Location",
        severityLevel: severityLevel || "HIGH",
        identityStatus: identityStatus || "UNVERIFIED",
        status: "ACTIVE",
        manualPatientName: identityStatus === "UNVERIFIED" ? manualPatientName : undefined,
        manualPatientAge: identityStatus === "UNVERIFIED" ? manualPatientAge : undefined,
        manualPatientGender: identityStatus === "UNVERIFIED" ? manualPatientGender : undefined
      }
    });

    // Create Initial EMS Vitals for PRIMARY patient
    await prisma.eMSVitals.create({
      data: {
        caseId: newCase.id,
        emsId: session.user.id,
        passengerId: "PRIMARY",
        patientName: identityStatus === "UNVERIFIED" ? manualPatientName : undefined,
        consciousnessStatus: "UNKNOWN"
      }
    });

    // Create Initial EMS Vitals for Co-Passengers if they are verified or manually added
    if (passengersData && Array.isArray(passengersData)) {
      for (const p of passengersData) {
        if (p.status) {
          await prisma.eMSVitals.create({
            data: {
              caseId: newCase.id,
              emsId: session.user.id,
              passengerId: p.passengerId,
              patientName: p.name || "Unknown Passenger",
              consciousnessStatus: "UNKNOWN"
            }
          });
        }
      }
    }

    // Create notification for emergency contacts if available
    if (citizenId) {
      const citizen = await prisma.citizenProfile.findUnique({
        where: { id: citizenId },
        include: { user: true }
      });

      if (citizen && citizen.emergencyContactPhone) {
        await prisma.notification.create({
          data: {
            caseId: newCase.id,
            recipientName: citizen.emergencyContactName || "Emergency Contact",
            recipientPhone: citizen.emergencyContactPhone,
            type: "EMERGENCY_CONTACT_ALERT",
            message: `${citizen.user.fullName} has been involved in a reported emergency at ${accidentAddress}. EMS is on site.`,
            trackingLink: `/track/${newCase.id}`,
            status: "SENT"
          }
        });
      }
    }

    return NextResponse.json({ success: true, caseId: newCase.id });
  } catch (error) {
    console.error("EMS Create Case API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
