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

    const scans = await prisma.auditLog.findMany({
      where: { 
        action: "QR_SCAN",
        role: "EMS"
      },
      orderBy: { createdAt: "desc" },
      take: 50,

    });

    // To make it rich, we might parse the details, or fetch related entities.
    // Assuming we store `entityId` as the qrCode.id
    const qrIds = scans.map(s => s.entityId).filter(Boolean) as string[];
    const qrs = await prisma.qRCode.findMany({
      where: { id: { in: qrIds } },
      include: {
        citizen: { include: { user: true } },
        vehicle: true
      }
    });

    const enrichedScans = scans.map(scan => {
      const qr = qrs.find(q => q.id === scan.entityId);
      return {
        ...scan,
        citizenName: qr?.citizen?.user?.fullName || "Unknown",
        vehicleNumber: qr?.vehicle?.vehicleNumber || "Unknown",
        qrToken: qr?.qrToken || "Unknown"
      };
    });

    return NextResponse.json({ scans: enrichedScans });
  } catch (error) {
    console.error("EMS Recent Scans GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
