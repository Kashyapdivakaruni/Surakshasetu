import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session using the shared auth helper
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Determine redirect
    let redirectUrl = "/";
    if (user.role === "CITIZEN") redirectUrl = "/citizen/dashboard";
    if (user.role === "EMS") redirectUrl = "/ems/dashboard";
    if (user.role === "HOSPITAL") redirectUrl = "/hospital/dashboard";
    if (user.role === "POLICE") redirectUrl = "/police/dashboard";

    return NextResponse.json({ 
      user: { id: user.id, email: user.email, role: user.role },
      redirectUrl 
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
