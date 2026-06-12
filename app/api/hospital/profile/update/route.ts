import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HOSPITAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { icuBedsAvailable, emergencyBedsAvailable, status } = await req.json();

    const updatedProfile = await prisma.hospitalProfile.update({
      where: { userId: session.user.id },
      data: {
        icuBedsAvailable,
        emergencyBedsAvailable,
        status
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Hospital Profile Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
