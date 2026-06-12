/**
 * app/api/video/token/route.ts
 *
 * Generates a LiveKit participant access token for an authenticated user.
 *
 * Usage:
 *   GET /api/video/token?caseId=<caseId>
 *
 * Returns:
 *   { token: string, serverUrl: string }
 *
 * Security model:
 *  - Session cookie is validated on every request (existing auth system).
 *  - HOSPITAL users: must be the hospital assigned to this specific case.
 *  - EMS users: any authenticated EMS user may join any case's room
 *    (matches the existing /api/ems/case/* authorization convention).
 *  - A video room must already exist (videoRoomId set on HospitalResponse)
 *    before a token is issued. Callers must invoke /api/video/create-room first.
 *  - LIVEKIT_API_KEY and LIVEKIT_API_SECRET never leave the server.
 *    The client receives only the signed JWT token and the public wss:// URL.
 *
 * Token properties:
 *  - Identity: session.user.id  (database User ID — auditable, unique per person)
 *  - Name:     User.fullName    (displayed in the LiveKit video UI)
 *  - TTL:      2 hours          (covers any realistic emergency consultation)
 *  - Grants:   roomJoin, canPublish, canSubscribe, canPublishData
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateLiveKitToken } from "@/lib/livekit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ------------------------------------------------------------------
  // 1. Authentication
  // ------------------------------------------------------------------
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user as {
    role: string;
    id: string;
  };

  if (role !== "EMS" && role !== "HOSPITAL") {
    return NextResponse.json(
      {
        error:
          "Forbidden. Only EMS and HOSPITAL users may join a video consultation.",
      },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------------
  // 2. Input validation
  // ------------------------------------------------------------------
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");

  if (!caseId || caseId.trim() === "") {
    return NextResponse.json(
      { error: "Query parameter 'caseId' is required." },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 3. Fetch case with hospital response (to retrieve the room name)
  // ------------------------------------------------------------------
  const emergencyCase = await prisma.accidentCase.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      assignedHospitalId: true,
      status: true,
      hospitalResponses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          hospitalId: true,
          videoRoomId: true,
          videoStatus: true,
        },
      },
    },
  });

  if (!emergencyCase) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  // ------------------------------------------------------------------
  // 4. Role-specific authorization
  // ------------------------------------------------------------------
  if (role === "HOSPITAL") {
    // Hospital user must be assigned to this specific case.
    // Matches the check in GET /api/hospital/case/[caseId]/route.ts.
    if (emergencyCase.assignedHospitalId !== userId) {
      return NextResponse.json(
        {
          error:
            "Forbidden. This case is assigned to a different hospital.",
        },
        { status: 403 }
      );
    }
  }
  // EMS: role check is sufficient — matches /api/ems/case/[caseId] convention.

  // ------------------------------------------------------------------
  // 5. Verify a room exists for this case
  // ------------------------------------------------------------------
  const hospitalResponse = emergencyCase.hospitalResponses[0];
  const roomName = hospitalResponse?.videoRoomId;

  if (!roomName) {
    return NextResponse.json(
      {
        error:
          "No video room exists for this case yet. Call POST /api/video/create-room first.",
      },
      { status: 404 }
    );
  }

  // ------------------------------------------------------------------
  // 6. Resolve the participant's display name from the database
  //
  // The session JWT only stores { id, role, email }. We fetch fullName
  // from the database so the LiveKit video UI shows the person's real
  // name rather than their email address or UUID.
  // ------------------------------------------------------------------
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true },
  });

  // Fallback chain: fullName → email → userId (should never reach userId)
  const participantName =
    dbUser?.fullName?.trim() ||
    dbUser?.email ||
    userId;

  // ------------------------------------------------------------------
  // 7. Generate LiveKit participant token
  //
  // participantIdentity = userId:
  //   - Unique per person in this LiveKit project
  //   - Allows LiveKit to enforce one session per identity per room
  //     (if duplicate identity joins, it kicks the old session — good for
  //     reconnect scenarios)
  //   - Auditable: LiveKit logs show database IDs, not display names
  // ------------------------------------------------------------------
  let token: string;
  let serverUrl: string;

  try {
    const result = await generateLiveKitToken({
      roomName,
      participantIdentity: userId,
      participantName,
      canPublish: true,
      canSubscribe: true,
      ttlSeconds: 7200, // 2 hours
    });

    token = result.token;
    serverUrl = result.serverUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Video] Token generation failed:", message);

    // Surface a clear error if env vars are missing — useful during setup
    if (message.includes("LIVEKIT_")) {
      return NextResponse.json(
        {
          error:
            "Video service is not configured. Add LIVEKIT_* environment variables.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate video token. Please try again." },
      { status: 502 }
    );
  }

  // ------------------------------------------------------------------
  // 8. Audit log
  // ------------------------------------------------------------------
  await prisma.auditLog.create({
    data: {
      userId,
      role,
      action: "VIDEO_TOKEN_ISSUED",
      entityType: "ACCIDENT_CASE",
      entityId: caseId,
      details: `Token issued for room "${roomName}" to ${role} user "${participantName}"`,
    },
  });

  // ------------------------------------------------------------------
  // 9. Return token — safe for the client to receive
  //
  // IMPORTANT: Only `token` and `serverUrl` are returned.
  // LIVEKIT_API_KEY and LIVEKIT_API_SECRET are never included.
  // `serverUrl` resolves to NEXT_PUBLIC_LIVEKIT_URL which is already
  // public by convention (the wss:// address, not the API credentials).
  // ------------------------------------------------------------------
  return NextResponse.json({
    token,
    serverUrl,
    roomName,
    participantName,
  });
}
