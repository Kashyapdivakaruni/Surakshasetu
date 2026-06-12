import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateSecureToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let citizenProfile = await prisma.citizenProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!citizenProfile) {
      citizenProfile = await prisma.citizenProfile.create({
        data: { userId: session.user.id }
      });
    }

    // Check if an active QR exists
    let qrCode = await prisma.qRCode.findFirst({
      where: { 
        citizenId: citizenProfile.id,
        isActive: true
      },
      include: {
        vehicle: true
      }
    });

    // If no active QR exists, create a permanent one
    if (!qrCode) {
      // Find default vehicle to link, if any
      const vehicle = await prisma.vehicle.findFirst({
        where: { citizenId: citizenProfile.id }
      });

      if (!vehicle) {
        return NextResponse.json({ error: "Please register a vehicle first to generate a QR." }, { status: 400 });
      }

      const token = generateSecureToken();

      qrCode = await prisma.qRCode.create({
        data: {
          citizenId: citizenProfile.id,
          vehicleId: vehicle.id,
          qrToken: token,
          isActive: true
        },
        include: {
          vehicle: true
        }
      });
    }

    return NextResponse.json({ qrCode });
  } catch (error) {
    console.error("QR GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
