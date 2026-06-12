import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateSecureToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const citizenProfile = await prisma.citizenProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!citizenProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Invalidate existing active QR
    const existingQr = await prisma.qRCode.findFirst({
      where: { 
        citizenId: citizenProfile.id,
        isActive: true
      }
    });

    if (existingQr) {
      await prisma.qRCode.update({
        where: { id: existingQr.id },
        data: { 
          isActive: false,
          revokedAt: new Date()
        }
      });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { citizenId: citizenProfile.id }
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Please register a vehicle first." }, { status: 400 });
    }

    const token = generateSecureToken();

    const newQrCode = await prisma.qRCode.create({
      data: {
        citizenId: citizenProfile.id,
        vehicleId: vehicle.id,
        qrToken: token,
        isActive: true,
        regeneratedAt: new Date()
      },
      include: {
        vehicle: true
      }
    });

    return NextResponse.json({ success: true, qrCode: newQrCode });
  } catch (error) {
    console.error("QR Regenerate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
