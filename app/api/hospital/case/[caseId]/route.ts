import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HOSPITAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;

    const emergencyCase = await prisma.accidentCase.findUnique({
      where: { id: caseId },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true } },
            medicalInfo: true,
            passengers: true
          }
        },
        vehicle: true,
        emsVitals: {
          orderBy: { createdAt: "desc" }
        },
        uploadedFiles: {
          where: { fileType: "MEDICAL_DEVICE_IMAGE" }
        },
        hospitalResponses: {
          where: { hospitalId: session.user.id },
          orderBy: { createdAt: "desc" }
        },
        policeReports: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!emergencyCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (emergencyCase.assignedHospitalId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. Case assigned to another hospital." }, { status: 403 });
    }

    // Create Audit Log for viewing
    await prisma.auditLog.create({
      data: {
        action: "HOSPITAL_CASE_VIEWED",
        entityType: "ACCIDENT_CASE",
        entityId: caseId,
        userId: session.user.id,
        role: "HOSPITAL"
      }
    });

    // Fetch Hospital Profile for metadata
    const hospitalProfile = await prisma.hospitalProfile.findFirst({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ emergencyCase, hospitalProfile });
  } catch (error) {
    console.error("Hospital Case GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
