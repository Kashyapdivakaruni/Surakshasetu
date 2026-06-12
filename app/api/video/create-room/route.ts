/**
 * app/api/video/create-room/route.ts
 *
 * Creates (or reuses) a LiveKit room for a given emergency case.
 *
 * Business rules:
 *  - Either an EMS user OR a Hospital user may call this endpoint.
 *  - Room creation is idempotent: calling this endpoint multiple times for
 *    the same case always returns the same room name without creating
 *    duplicate rooms.
 *  - A hospital must be assigned to the case before a room can be created.
 *
 * Authorization:
 *  - HOSPITAL: session user must be the hospital assigned to the case
 *              (AccidentCase.assignedHospitalId === session.user.id)
 *  - EMS: any authenticated EMS user may create a room for any active case
 *         (matches existing EMS authorization convention in /api/ems/case/*)
 *
 * Response:
 *  { roomName: string }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  createLiveKitRoom,
  getRoomNameForCase,
} from "@/lib/livekit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
      { error: "Forbidden. Only EMS and HOSPITAL users may start a video consultation." },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------------
  // 2. Input validation
  // ------------------------------------------------------------------
  let caseId: string;

  try {
    const body = await req.json();
    caseId = body?.caseId;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with { caseId }." },
      { status: 400 }
    );
  }

  if (!caseId || typeof caseId !== "string" || caseId.trim() === "") {
    return NextResponse.json(
      { error: "caseId is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 3. Fetch case + hospital response
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

  // A hospital must be assigned before a video room can exist — this ensures
  // there is always a matching HospitalResponse record to store the room name.
  if (!emergencyCase.assignedHospitalId) {
    return NextResponse.json(
      { error: "No hospital has been assigned to this case yet. A video consultation cannot be started." },
      { status: 422 }
    );
  }

  // ------------------------------------------------------------------
  // 4. Role-specific authorization
  // ------------------------------------------------------------------
  if (role === "HOSPITAL") {
    // Hospital must be the one assigned to this specific case.
    // This matches the pattern in /api/hospital/case/[caseId]/route.ts.
    if (emergencyCase.assignedHospitalId !== userId) {
      return NextResponse.json(
        { error: "Forbidden. This case is assigned to a different hospital." },
        { status: 403 }
      );
    }
  }
  // EMS: any authenticated EMS user may access any case.
  // This matches the convention in /api/ems/case/[caseId]/route.ts
  // which does not restrict by scannedByEmsId.

  // ------------------------------------------------------------------
  // 5. Idempotency — reuse existing room if already created
  // ------------------------------------------------------------------
  const hospitalResponse = emergencyCase.hospitalResponses[0];

  if (hospitalResponse?.videoRoomId) {
    // Room was already created. Return the existing name immediately.
    // This handles the case where either party calls this endpoint twice,
    // or both parties call it simultaneously.
    return NextResponse.json({
      roomName: hospitalResponse.videoRoomId,
      created: false,
    });
  }

  // ------------------------------------------------------------------
  // 6. Create LiveKit room
  // ------------------------------------------------------------------
  let roomName: string;

  try {
    await createLiveKitRoom(caseId);
    roomName = getRoomNameForCase(caseId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Video] Failed to create LiveKit room:", message);
    return NextResponse.json(
      { error: "Failed to create video room. Please try again." },
      { status: 502 }
    );
  }

  // ------------------------------------------------------------------
  // 7. Persist room name to database
  // ------------------------------------------------------------------
  // If a HospitalResponse record exists, update it.
  // If not (edge case: room created before hospital acknowledged), we
  // upsert against the assigned hospital's response.
  try {
    if (hospitalResponse?.id) {
      await prisma.hospitalResponse.update({
        where: { id: hospitalResponse.id },
        data: {
          videoRoomId: roomName,
          videoStatus: "ACTIVE",
        },
      });
    } else {
      // Fallback: create a HospitalResponse if somehow missing
      await prisma.hospitalResponse.create({
        data: {
          caseId,
          hospitalId: emergencyCase.assignedHospitalId,
          status: "NOTIFIED",
          videoRoomId: roomName,
          videoStatus: "ACTIVE",
        },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Video] Failed to persist room to database:", message);
    // The LiveKit room was created — we still return success so the user
    // can join. The next call will be idempotent on the LiveKit side.
    // However we log the DB failure for investigation.
    return NextResponse.json(
      { error: "Video room created but failed to save. Please refresh and try again." },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------------
  // 8. Audit log
  // ------------------------------------------------------------------
  await prisma.auditLog.create({
    data: {
      userId,
      role,
      action: "VIDEO_ROOM_CREATED",
      entityType: "ACCIDENT_CASE",
      entityId: caseId,
      details: `LiveKit room "${roomName}" created by ${role} user ${userId}`,
    },
  });

  return NextResponse.json({ roomName, created: true }, { status: 201 });
}
