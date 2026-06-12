import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
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
        hospitalResponses: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!emergencyCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Map hospital data manually
    let emergencyCaseWithHospital = { ...emergencyCase } as any;
    if (emergencyCase.assignedHospitalId) {
      const hospital = await prisma.hospitalProfile.findUnique({
        where: { userId: emergencyCase.assignedHospitalId }
      });
      if (hospital && emergencyCase.hospitalResponses?.length > 0) {
        emergencyCaseWithHospital.hospitalResponses[0].hospital = hospital;
      }
    }

    return NextResponse.json({ emergencyCase: emergencyCaseWithHospital });
  } catch (error) {
    console.error("EMS Case GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;
    const { hospitalId, ambulanceEtaMinutes } = await req.json();

    if (!hospitalId) {
      return NextResponse.json({ error: "Hospital ID required" }, { status: 400 });
    }

    // Assign hospital
    const updatedCase = await prisma.accidentCase.update({
      where: { id: caseId },
      data: {
        assignedHospitalId: hospitalId,
        status: "HOSPITAL_NOTIFIED",
        ambulanceEtaMinutes
      },
      include: {
        citizen: { include: { user: true } }
      }
    });

    // Create Hospital Response
    await prisma.hospitalResponse.create({
      data: {
        caseId,
        hospitalId,
        status: "NOTIFIED"
      }
    });

    const hospital = await prisma.hospitalProfile.findUnique({ where: { userId: hospitalId }, include: { user: true } });

    // Create Notifications
    if (hospital) {
      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          action: "HOSPITAL_ASSIGNED",
          entityType: "ACCIDENT_CASE",
          entityId: caseId,
          userId: session.user.id,
          role: "EMS"
        }
      });

      await prisma.notification.create({
        data: {
          caseId,
          recipientName: hospital.hospitalName,
          recipientPhone: hospital.contactNumber,
          type: "IN_APP",
          message: `Incoming ${updatedCase.severityLevel} case for ${updatedCase.citizen?.user?.fullName || updatedCase.manualPatientName || "Unknown Patient"}. ETA: ${updatedCase.ambulanceEtaMinutes || "Unknown"} mins. Check dashboard for vitals.`,
          trackingLink: `/track/${caseId}`,
          status: "SENT"
        }
      });
    }

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error) {
    console.error("EMS Case PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;

    const emergencyCase = await prisma.accidentCase.findUnique({
      where: { id: caseId }
    });

    if (!emergencyCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Cancel active hospital responses
    await prisma.hospitalResponse.updateMany({
      where: {
        caseId,
        status: { in: ["NOTIFIED", "PREPARING"] }
      },
      data: { status: "CANCELLED" }
    });

    // Reset case assignment
    const updatedCase = await prisma.accidentCase.update({
      where: { id: caseId },
      data: {
        assignedHospitalId: null,
        status: "ACTIVE",
        ambulanceEtaMinutes: null
      }
    });

    // Log the cancellation
    await prisma.auditLog.create({
      data: {
        action: "HOSPITAL_UNASSIGNED",
        entityType: "ACCIDENT_CASE",
        entityId: caseId,
        userId: session.user.id,
        role: "EMS",
        details: "Hospital assignment cancelled by EMS"
      }
    });

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error) {
    console.error("EMS Case DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
