import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "POLICE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cases = await prisma.accidentCase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true, profilePhoto: true } },
            passengers: true
          }
        },
        vehicle: true,
        policeReports: true
      }
    });

    // Get QR scan logs for Police
    const scanLogs = await prisma.auditLog.findMany({
      where: {
        role: "POLICE",
        action: "QR_SCAN",
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to recent 50 logs
    });

    const scanLogsCount = scanLogs.filter(log => new Date(log.createdAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

    return NextResponse.json({ cases, scanLogsCount, scanLogs });
  } catch (error) {
    console.error("Police Cases API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
