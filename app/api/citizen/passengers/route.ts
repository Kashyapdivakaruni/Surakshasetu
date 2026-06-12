import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const citizenProfile = await prisma.citizenProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!citizenProfile) {
      return NextResponse.json({ passengers: [] });
    }

    const passengers = await prisma.passenger.findMany({
      where: { citizenId: citizenProfile.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ passengers });
  } catch (error) {
    console.error("Passengers GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    let citizenProfile = await prisma.citizenProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!citizenProfile) {
      citizenProfile = await prisma.citizenProfile.create({
        data: { userId: session.user.id }
      });
    }

    if (!data.name || !data.age || !data.gender || !data.relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passenger = await prisma.passenger.create({
      data: {
        citizenId: citizenProfile.id,
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender,
        relationship: data.relationship,
        photo: data.photo || null,
        bloodGroup: data.bloodGroup || null,
        healthConditions: data.healthConditions || null,
        allergies: data.allergies || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null
      }
    });

    return NextResponse.json({ success: true, passenger });
  } catch (error) {
    console.error("Passengers POST Error:", error);
    return NextResponse.json({ error: "Failed to add passenger" }, { status: 500 });
  }
}
