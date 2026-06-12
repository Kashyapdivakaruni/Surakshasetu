import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "POLICE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let report = await prisma.policeReport.findFirst({
      where: { caseId: params.caseId }
    });

    if (!report) {
      report = await prisma.policeReport.create({
        data: {
          caseId: params.caseId,
          officerId: session.user.id
        }
      });
    }

    const emergencyCase = await prisma.accidentCase.findUnique({
      where: { id: params.caseId },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, profilePhoto: true } },
            passengers: true
          }
        },
        vehicle: true,
        policeReports: true
      }
    });

    return NextResponse.json({ report, emergencyCase });
  } catch (error) {
    console.error("Police Report GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "POLICE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("POLICE REPORT PUT REQUEST:", { caseId: params.caseId, body });
    const { firNumber, accidentDescription, accidentLocation, vehicleVerificationStatus, legalNotes, identityVerified, closeCase } = body;

    if (closeCase) {
      await prisma.accidentCase.update({
        where: { id: params.caseId },
        data: { status: "CLOSED" }
      });
      return NextResponse.json({ success: true, closed: true });
    }

    let report = await prisma.policeReport.findFirst({
      where: { caseId: params.caseId }
    });

    if (report) {
      report = await prisma.policeReport.update({
        where: { id: report.id },
        data: {
          firNumber: firNumber !== undefined ? firNumber : report.firNumber,
          accidentDescription: accidentDescription !== undefined ? accidentDescription : report.accidentDescription,
          accidentLocation: accidentLocation !== undefined ? accidentLocation : report.accidentLocation,
          vehicleVerificationStatus: vehicleVerificationStatus !== undefined ? vehicleVerificationStatus : report.vehicleVerificationStatus,
          legalNotes: legalNotes !== undefined ? legalNotes : report.legalNotes
        }
      });
    } else {
      report = await prisma.policeReport.create({
        data: {
          caseId: params.caseId,
          officerId: session.user.id,
          firNumber,
          accidentDescription,
          accidentLocation,
          vehicleVerificationStatus,
          legalNotes
        }
      });
    }

    if (identityVerified !== undefined) {
      await prisma.accidentCase.update({
        where: { id: params.caseId },
        data: { identityStatus: identityVerified ? "VERIFIED" : "REJECTED" }
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Police Report PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
