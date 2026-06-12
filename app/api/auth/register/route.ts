import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: name,
        email,
        phone,
        passwordHash,
        role,
        ...(role === "CITIZEN" ? {
          citizenProfile: {
            create: {}
          }
        } : role === "HOSPITAL" ? {
          hospitalProfile: {
            create: {
              hospitalName: name,
              contactNumber: phone,
              address: "Address pending update",
              latitude: 17.3850 + (Math.random() * 0.05 - 0.025), // slight randomization around central point
              longitude: 78.4867 + (Math.random() * 0.05 - 0.025),
              status: "Available"
            }
          }
        } : {}),
      },
    });

    return NextResponse.json({ message: "User registered successfully", user: { id: user.id, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
