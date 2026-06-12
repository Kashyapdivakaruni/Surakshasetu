import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cases = await prisma.accidentCase.findMany({
      where: { 
        status: { in: ["ACTIVE", "EN_ROUTE", "HOSPITAL_NOTIFIED"] } 
      },
      orderBy: { createdAt: "desc" },
      include: {
        citizen: { include: { user: true, passengers: true, medicalInfo: true } },
        hospitalResponses: true
      }
    });

    // Manually attach hospital names since there's no direct relation setup on HospitalResponse
    const hospitalIds = cases.map(c => c.assignedHospitalId).filter(Boolean) as string[];
    const hospitals = await prisma.hospitalProfile.findMany({
      where: { userId: { in: hospitalIds } }
    });

    const casesWithHospitals = cases.map(c => {
      const hospital = hospitals.find(h => h.userId === c.assignedHospitalId);
      return {
        ...c,
        assignedHospitalName: hospital ? hospital.hospitalName : "Not Assigned"
      };
    });

    return NextResponse.json({ cases: casesWithHospitals });
  } catch (error) {
    console.error("EMS Critical Cases GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
