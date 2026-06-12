import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "POLICE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { qrCodeId, citizenId, vehicleId, accidentAddress } = body;

    const accidentCase = await prisma.accidentCase.create({
      data: {
        qrCodeId,
        citizenId,
        vehicleId,
        accidentAddress,
        severityLevel: "MEDIUM",
        status: "ACTIVE",
        identityStatus: "VERIFIED"
      }
    });

    return NextResponse.json({ caseId: accidentCase.id });
  } catch (error) {
    console.error("Police Case Create API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
