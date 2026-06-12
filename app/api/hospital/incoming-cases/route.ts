import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HOSPITAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the hospital profile for this user
    const hospitalProfile = await prisma.hospitalProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!hospitalProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    // Fetch cases assigned to this hospital
    const incomingCases = await prisma.accidentCase.findMany({
      where: {
        assignedHospitalId: session.user.id,
        status: {
          in: [
            "HOSPITAL_NOTIFIED",
            "EN_ROUTE",
            "ADMITTED",
            "UNDER_TREATMENT",
            "CRITICAL",
            "STABLE"
          ]
        }
      },
      orderBy: { updatedAt: "desc" },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, profilePhoto: true } },
            medicalInfo: true,
            passengers: true
          }
        },
        emsVitals: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        uploadedFiles: {
          where: { fileType: "MEDICAL_DEVICE_IMAGE" },
          select: { id: true, dataUrl: true }
        },
        hospitalResponses: {
          where: { hospitalId: session.user.id },
          take: 1
        }
      }
    });

    return NextResponse.json({ incomingCases, profile: hospitalProfile });
  } catch (error) {
    console.error("Hospital Incoming Cases API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
