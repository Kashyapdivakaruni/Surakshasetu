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
      return NextResponse.json({ vehicles: [] });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { citizenId: citizenProfile.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Vehicle GET Error:", error);
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

    if (!data.vehicleNumber || !data.vehicleType || !data.registrationState) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        citizenId: citizenProfile.id,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        vehicleType: data.vehicleType,
        vehicleColor: data.vehicleColor || "",
        registrationState: data.registrationState
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("Vehicle POST Error:", error);
    return NextResponse.json({ error: "Failed to add vehicle" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    // Verify ownership
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: data.id },
      include: { citizen: true }
    });

    if (!existingVehicle || existingVehicle.citizen.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this vehicle" }, { status: 403 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: data.id },
      data: {
        vehicleNumber: data.vehicleNumber?.toUpperCase(),
        vehicleType: data.vehicleType,
        vehicleColor: data.vehicleColor,
        registrationState: data.registrationState
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("Vehicle PUT Error:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    // Verify ownership
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { citizen: true }
    });

    if (!existingVehicle || existingVehicle.citizen.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this vehicle" }, { status: 403 });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vehicle DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
