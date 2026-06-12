import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;

    // Update case status to CLOSED
    const updatedCase = await prisma.accidentCase.update({
      where: { id: caseId },
      data: { status: "CLOSED" }
    });

    // If hospital was assigned, sync status
    if (updatedCase.assignedHospitalId) {
      const existingResponse = await prisma.hospitalResponse.findFirst({
        where: { caseId, hospitalId: updatedCase.assignedHospitalId }
      });
      if (existingResponse) {
        await prisma.hospitalResponse.update({
          where: { id: existingResponse.id },
          data: { status: "CLOSED" }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMS Close Case API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
