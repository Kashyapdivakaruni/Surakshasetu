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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        citizenProfile: {
          include: { medicalInfo: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      profile: user.citizenProfile || {},
      medicalInfo: user.citizenProfile?.medicalInfo || {}
    });
  } catch (error: any) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Ensure citizen profile exists
    let citizenProfile = await prisma.citizenProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!citizenProfile) {
      citizenProfile = await prisma.citizenProfile.create({
        data: { userId: session.user.id }
      });
    }

    // Update User (e.g. fullName, profilePhoto)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: data.fullName,
        profilePhoto: data.profilePhoto
      }
    });

    // Update Citizen Profile
    await prisma.citizenProfile.update({
      where: { id: citizenProfile.id },
      data: {
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactEmail: data.emergencyContactEmail,
        organDonorStatus: data.organDonorStatus || false,
      }
    });

    // Update Medical Info
    if (data.medicalInfo) {
      const existingMedical = await prisma.medicalInfo.findUnique({
        where: { citizenId: citizenProfile.id }
      });

      if (existingMedical) {
        await prisma.medicalInfo.update({
          where: { citizenId: citizenProfile.id },
          data: {
            previousConditions: data.medicalInfo.previousConditions,
            allergies: data.medicalInfo.allergies,
            currentMedications: data.medicalInfo.currentMedications,
            disabilities: data.medicalInfo.disabilities,
            notes: data.medicalInfo.notes,
          }
        });
      } else {
        await prisma.medicalInfo.create({
          data: {
            citizenId: citizenProfile.id,
            previousConditions: data.medicalInfo.previousConditions,
            allergies: data.medicalInfo.allergies,
            currentMedications: data.medicalInfo.currentMedications,
            disabilities: data.medicalInfo.disabilities,
            notes: data.medicalInfo.notes,
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("Profile PUT Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
