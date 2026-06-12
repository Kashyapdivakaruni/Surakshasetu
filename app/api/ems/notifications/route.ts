/**
 * app/api/ems/notifications/route.ts
 *
 * Unified notifications API endpoint supporting:
 *  - GET: Retrieves global and targeted notifications for the current user/role
 *  - POST: Creates a new video call request notification (status: PENDING)
 *  - PATCH: Accepts or dismisses a video call request notification
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createLiveKitRoom, getRoomNameForCase } from "@/lib/livekit";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user as { role: string; id: string };

    if (role !== "EMS" && role !== "HOSPITAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Retrieve global notifications and notifications targeted to this user or role
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientUserId: null, recipientRole: null }, // Global system alerts
          { recipientUserId: userId },                     // Direct target
          { recipientRole: role },                         // Role target
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user as { role: string; id: string };

    if (role !== "EMS" && role !== "HOSPITAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { caseId, type } = await req.json();

    if (!caseId || !type) {
      return NextResponse.json({ error: "caseId and type are required" }, { status: 400 });
    }

    if (type !== "VIDEO_CALL_REQUEST" && type !== "VIDEO_CALL_ACCEPTED") {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    // Fetch the active emergency case to resolve identifiers
    const emergencyCase = await prisma.accidentCase.findUnique({
      where: { id: caseId },
      include: {
        citizen: {
          include: {
            user: true,
          },
        },
        hospitalResponses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!emergencyCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (!emergencyCase.assignedHospitalId) {
      return NextResponse.json(
        { error: "No hospital assigned to this case. Cannot request video call." },
        { status: 422 }
      );
    }

    let recipientUserId: string | null = null;
    let recipientRole = "";
    let recipientName = "";
    let recipientPhone = "";
    let message = "";

    const patientName =
      emergencyCase.citizen?.user?.fullName ||
      emergencyCase.manualPatientName ||
      "Emergency Patient";

    if (role === "EMS") {
      // EMS initiates request → recipient is the Hospital User
      recipientUserId = emergencyCase.assignedHospitalId;
      recipientRole = "HOSPITAL";

      // Fetch hospital details for fallback naming
      const hospital = await prisma.hospitalProfile.findUnique({
        where: { userId: emergencyCase.assignedHospitalId },
      });
      recipientName = hospital?.hospitalName || "Hospital";
      recipientPhone = hospital?.contactNumber || "";
      message =
        type === "VIDEO_CALL_REQUEST"
          ? `EMS Paramedic is requesting an emergency video consultation for Patient: ${patientName}.`
          : `EMS Paramedic accepted the video consultation request.`;
    } else {
      // HOSPITAL initiates request → recipient is the EMS user who scanned the case
      // Fallback to role target if scannedByEmsId is not set
      recipientUserId = emergencyCase.scannedByEmsId || null;
      recipientRole = "EMS";
      recipientName = "EMS Paramedic";
      recipientPhone = "EMS";
      message =
        type === "VIDEO_CALL_REQUEST"
          ? `Hospital Doctor is requesting an emergency video consultation for Patient: ${patientName}.`
          : `Hospital Doctor accepted the video consultation request.`;
    }

    // Check if there is already a PENDING request for this case/recipient to prevent spamming
    const existingPending = await prisma.notification.findFirst({
      where: {
        caseId,
        type: "VIDEO_CALL_REQUEST",
        status: "PENDING",
        recipientRole,
      },
    });

    if (existingPending && type === "VIDEO_CALL_REQUEST") {
      return NextResponse.json(
        { success: true, notification: existingPending, message: "A request is already pending." },
        { status: 200 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        caseId,
        recipientName,
        recipientPhone,
        type,
        message,
        status: "PENDING", // Initial persistent request state
        senderUserId: userId,
        senderRole: role,
        recipientUserId,
        recipientRole,
      },
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("Notifications POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH Handler (Accept/Dismiss request)
// ---------------------------------------------------------------------------
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user as { role: string; id: string };

    if (role !== "EMS" && role !== "HOSPITAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { notificationId, status } = await req.json();

    if (!notificationId || !status) {
      return NextResponse.json({ error: "notificationId and status are required" }, { status: 400 });
    }

    if (status !== "ACCEPTED" && status !== "DISMISSED") {
      return NextResponse.json({ error: "Invalid status state transition" }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Security check: only the recipient (either by UserID or Role) may modify this notification
    const isTargetUser = notification.recipientUserId === userId;
    const isTargetRole = notification.recipientRole === role;

    if (!isTargetUser && !isTargetRole) {
      return NextResponse.json({ error: "Forbidden. You are not the recipient of this request." }, { status: 403 });
    }

    // -----------------------------------------------------------------------
    // Action 1: Update status state in the database
    // -----------------------------------------------------------------------
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { status },
    });

    // -----------------------------------------------------------------------
    // Action 2: If accepted, ensure the LiveKit room is created and persisted
    // -----------------------------------------------------------------------
    if (status === "ACCEPTED" && notification.caseId) {
      const caseId = notification.caseId;

      // Fetch case to get assigned hospital details
      const emergencyCase = await prisma.accidentCase.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          assignedHospitalId: true,
          hospitalResponses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              videoRoomId: true,
            },
          },
        },
      });

      if (emergencyCase && emergencyCase.assignedHospitalId) {
        const hospitalResponse = emergencyCase.hospitalResponses[0];
        let roomName = hospitalResponse?.videoRoomId;

        // Create the room only if it does not exist in the database response
        if (!roomName) {
          try {
            await createLiveKitRoom(caseId);
            roomName = getRoomNameForCase(caseId);

            if (hospitalResponse?.id) {
              await prisma.hospitalResponse.update({
                where: { id: hospitalResponse.id },
                data: {
                  videoRoomId: roomName,
                  videoStatus: "ACTIVE",
                },
              });
            } else {
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
            console.error("[Video API] Deferred room creation failed during acceptance:", err);
            // We still return success for the notification update so the poller knows it was acted on
          }
        }
      }
    }

    return NextResponse.json({ success: true, notification: updatedNotification });
  } catch (error) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
