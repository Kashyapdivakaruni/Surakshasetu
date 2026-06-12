import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    // Verify ownership
    const existingPassenger = await prisma.passenger.findUnique({
      where: { id },
      include: { citizen: true }
    });

    if (!existingPassenger || existingPassenger.citizen.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this passenger" }, { status: 403 });
    }

    const passenger = await prisma.passenger.update({
      where: { id },
      data: {
        name: data.name,
        age: data.age ? parseInt(data.age) : undefined,
        gender: data.gender,
        relationship: data.relationship,
        photo: data.photo !== undefined ? data.photo : existingPassenger.photo,
        bloodGroup: data.bloodGroup,
        healthConditions: data.healthConditions,
        allergies: data.allergies,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone
      }
    });

    return NextResponse.json({ success: true, passenger });
  } catch (error) {
    console.error("Passenger PUT Error:", error);
    return NextResponse.json({ error: "Failed to update passenger" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existingPassenger = await prisma.passenger.findUnique({
      where: { id },
      include: { citizen: true }
    });

    if (!existingPassenger || existingPassenger.citizen.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this passenger" }, { status: 403 });
    }

    await prisma.passenger.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Passenger DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete passenger" }, { status: 500 });
  }
}
