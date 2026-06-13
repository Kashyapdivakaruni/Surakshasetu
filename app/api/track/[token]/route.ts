/**
 * Public Tracking API — GET /api/track/[token]
 *
 * No authentication required.
 * Resolves a tracking token to its accident case and returns
 * safe public-facing tracking information only.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface TrackingResponse {
  caseId: string;
  status: string;
  severityLevel: string | null;
  accidentAddress: string | null;
  hospitalName: string | null;
  admissionStatus: string | null;
  ambulanceEtaMinutes: number | null;
  lastUpdated: string;
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 20) {
      return NextResponse.json(
        { error: "Invalid tracking token." },
        { status: 400 }
      );
    }

    // Try looking up by trackingToken first
    let accidentCase = await prisma.accidentCase.findUnique({
      where: { trackingToken: token },
      include: {
        hospitalResponses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Fallback: look up by case ID (CUID)
    if (!accidentCase) {
      accidentCase = await prisma.accidentCase.findUnique({
        where: { id: token },
        include: {
          hospitalResponses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    }

    if (!accidentCase) {
      return NextResponse.json(
        {
          error:
            "Tracking link not found or has expired. Please contact the hospital or emergency services.",
        },
        { status: 404 }
      );
    }

    // Resolve hospital name safely without exposing internal IDs
    let hospitalName: string | null = null;
    let admissionStatus: string | null = null;

    if (accidentCase.hospitalResponses.length > 0) {
      const response = accidentCase.hospitalResponses[0];
      admissionStatus = response.status;

      if (accidentCase.assignedHospitalId) {
        const hospitalProfile = await prisma.hospitalProfile.findUnique({
          where: { userId: accidentCase.assignedHospitalId },
          select: { hospitalName: true },
        });
        hospitalName = hospitalProfile?.hospitalName ?? null;
      }
    }

    const payload: TrackingResponse = {
      caseId: accidentCase.id,
      status: accidentCase.status,
      severityLevel: accidentCase.severityLevel,
      accidentAddress: accidentCase.accidentAddress,
      hospitalName,
      admissionStatus,
      ambulanceEtaMinutes: accidentCase.ambulanceEtaMinutes,
      lastUpdated: accidentCase.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, tracking: payload });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Track API] Error:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
