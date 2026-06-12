import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { calculateHaversineDistance, estimateTravelTime } from "@/lib/distance";
import { computeHospitalAIScore } from "@/lib/aiTriage";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const severity = searchParams.get("severity") || "HIGH";
    
    // Default location (e.g. Outer Ring Road, Hyderabad)
    const lat = latParam ? parseFloat(latParam) : 17.3850;
    const lng = lngParam ? parseFloat(lngParam) : 78.4867;

    const hospitals = await prisma.hospitalProfile.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    const enrichedHospitals = hospitals.map(h => {
      const distance = calculateHaversineDistance(lat, lng, h.latitude, h.longitude);
      const eta = estimateTravelTime(distance);
      const aiScore = computeHospitalAIScore({
        distanceKm: Number(distance.toFixed(2)),
        icuBedsAvailable: h.icuBedsAvailable,
        emergencyBedsAvailable: h.emergencyBedsAvailable,
        traumaCareAvailable: h.traumaCareAvailable,
        emergencySupportAvailable: h.emergencySupportAvailable
      }, severity);

      return {
        ...h,
        email: h.user?.email || "Not Provided",
        distanceKm: Number(distance.toFixed(2)),
        etaMinutes: eta,
        aiScore
      };
    }).sort((a, b) => b.aiScore - a.aiScore); // Sort by AI score (highest first)

    return NextResponse.json({ hospitals: enrichedHospitals, location: { lat, lng } });
  } catch (error) {
    console.error("EMS Hospitals GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

