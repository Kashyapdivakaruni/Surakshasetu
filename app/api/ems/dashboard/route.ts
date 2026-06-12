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

    const [activeCases, recentScans, hospitalsNotified, notificationsSent, recentCase] = await Promise.all([
      prisma.accidentCase.count({ where: { status: { in: ["ACTIVE", "EN_ROUTE", "HOSPITAL_NOTIFIED"] } } }),
      prisma.auditLog.count({ where: { action: "QR_SCAN", role: "EMS", createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.hospitalResponse.count({ where: { status: "NOTIFIED" } }),
      prisma.notification.count({ where: { status: "SENT" } }),
      prisma.accidentCase.findFirst({
        where: { status: { in: ["ACTIVE", "EN_ROUTE", "HOSPITAL_NOTIFIED"] } },
        orderBy: { createdAt: "desc" },
        include: { citizen: { include: { user: true } } }
      })
    ]);

    return NextResponse.json({
      stats: {
        activeCases,
        recentScans,
        hospitalsNotified,
        notificationsSent
      },
      recentCase
    });
  } catch (error) {
    console.error("EMS Dashboard GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
