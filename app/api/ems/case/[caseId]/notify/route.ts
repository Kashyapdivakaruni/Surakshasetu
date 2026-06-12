/**
 * EMS Notify API — POST /api/ems/case/[caseId]/notify
 *
 * Called after hospital is assigned. This endpoint:
 *  1. Generates a stable tracking token for the case (if not already set)
 *  2. Sends a REAL SMS via Fast2SMS to the emergency contact
 *  3. Returns the real SMS delivery status and tracking URL
 *
 * EMS role required. SMS failure never breaks the workflow.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateTrackingToken, buildTrackingUrl } from "@/lib/tracking";
import { sendTrackingSms } from "@/lib/sms";

export async function POST(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;

    // Fetch the case with citizen + emergency contact details
    const accidentCase = await prisma.accidentCase.findUnique({
      where: { id: caseId },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        hospitalResponses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!accidentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // ── Step 1: Generate / reuse tracking token ──────────────────────────
    let trackingToken = accidentCase.trackingToken;
    if (!trackingToken) {
      trackingToken = generateTrackingToken();
      await prisma.accidentCase.update({
        where: { id: caseId },
        data: { trackingToken },
      });
      console.log(
        `[Tracking] Token generated for case ${caseId}: ${trackingToken.slice(0, 10)}…`
      );
    }

    const trackingUrl = buildTrackingUrl(trackingToken);

    // ── Step 2: Resolve recipient phone (emergency contact or citizen) ───
    const citizenProfile = accidentCase.citizen;
    const recipientPhone = citizenProfile?.user?.phone ?? null;
    const recipientName =
      citizenProfile?.user?.fullName ?? accidentCase.manualPatientName ?? "Patient";

    if (!recipientPhone) {
      console.warn(`[SMS] No phone number found for case ${caseId}. SMS skipped.`);
      return NextResponse.json({
        success: false,
        smsSent: false,
        reason: "No phone number on record",
        trackingUrl,
        trackingToken,
      });
    }

    // ── Step 3: Send the real SMS ─────────────────────────────────────────
    const smsResult = await sendTrackingSms(recipientPhone, trackingUrl, caseId);

    // ── Step 4: Record notification in DB ────────────────────────────────
    await prisma.notification.create({
      data: {
        caseId,
        recipientName,
        recipientPhone,
        type: "TRACKING_SMS",
        message: `Suraksha Setu Update: Your accident case has been registered successfully. Track status here: ${trackingUrl}`,
        trackingLink: trackingUrl,
        status: smsResult.success ? "SENT" : "FAILED",
        senderRole: "EMS",
        senderUserId: session.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "TRACKING_SMS_SENT",
        entityType: "ACCIDENT_CASE",
        entityId: caseId,
        userId: session.user.id,
        role: "EMS",
        details: smsResult.success
          ? `SMS delivered to ***${recipientPhone.slice(-4)}`
          : `SMS failed: ${smsResult.error}`,
      },
    });

    return NextResponse.json({
      success: true,
      smsSent: smsResult.success,
      smsError: smsResult.error ?? null,
      trackingUrl,
      trackingToken,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notify API] Error for case ${params.caseId}: ${msg}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
