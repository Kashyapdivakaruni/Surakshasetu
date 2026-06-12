/**
 * Hospital Prepare/Admit API — PATCH /api/hospital/prepare/[caseId]
 *
 * When the hospital sets status to ADMITTED, this route:
 *  1. Generates a stable tracking token (if not already set)
 *  2. Sends an SMS with the tracking link to the citizen's phone via Fast2SMS
 *  3. Updates the AccidentCase with trackingToken
 *  4. Records the notification in the DB
 *
 * SMS failure never blocks case progression.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateTrackingToken, buildTrackingUrl } from "@/lib/tracking";
import { sendTrackingSms } from "@/lib/sms";

export async function PATCH(
  req: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HOSPITAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;
    const { status, doctorAssigned, bedNumber, preparationNotes } =
      await req.json();

    const emergencyCase = await prisma.accidentCase.findUnique({
      where: { id: caseId },
      include: {
        citizen: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
    });

    if (!emergencyCase || emergencyCase.assignedHospitalId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden or not found" },
        { status: 403 }
      );
    }

    // Update HospitalResponse
    const hospitalResponse = await prisma.hospitalResponse.findFirst({
      where: { caseId, hospitalId: session.user.id },
    });

    if (hospitalResponse) {
      await prisma.hospitalResponse.update({
        where: { id: hospitalResponse.id },
        data: {
          status: status || hospitalResponse.status,
          doctorAssigned:
            doctorAssigned !== undefined
              ? doctorAssigned
              : hospitalResponse.doctorAssigned,
          bedNumber:
            bedNumber !== undefined ? bedNumber : hospitalResponse.bedNumber,
          preparationNotes:
            preparationNotes !== undefined
              ? preparationNotes
              : hospitalResponse.preparationNotes,
        },
      });
    }

    // Sync AccidentCase status
    let updatedCaseStatus = emergencyCase.status;
    if (status === "ADMITTED") updatedCaseStatus = "ADMITTED";
    if (status === "UNDER_TREATMENT") updatedCaseStatus = "UNDER_TREATMENT";
    if (status === "STABLE") updatedCaseStatus = "STABLE";
    if (status === "CRITICAL") updatedCaseStatus = "CRITICAL";

    if (updatedCaseStatus !== emergencyCase.status) {
      await prisma.accidentCase.update({
        where: { id: caseId },
        data: { status: updatedCaseStatus },
      });
    }

    // ─── Tracking Token + SMS (only on ADMITTED, fire-and-log) ─────────────
    if (status === "ADMITTED") {
      try {
        // Reuse existing token or generate a fresh one
        let trackingToken = emergencyCase.trackingToken;
        if (!trackingToken) {
          trackingToken = generateTrackingToken();
          await prisma.accidentCase.update({
            where: { id: caseId },
            data: { trackingToken },
          });
          console.log(
            `[Tracking] Token generated for case ${caseId}: ${trackingToken.slice(0, 8)}…`
          );
        }

        const trackingUrl = buildTrackingUrl(trackingToken);

        // Determine recipient phone — prefer citizen's registered phone
        const recipientPhone =
          emergencyCase.citizen?.user?.phone ?? null;

        if (recipientPhone) {
          const smsResult = await sendTrackingSms(
            recipientPhone,
            trackingUrl,
            caseId
          );

          // Record notification outcome in DB
          await prisma.notification.create({
            data: {
              caseId,
              recipientName:
                emergencyCase.citizen?.user?.fullName ?? "Patient",
              recipientPhone,
              type: "TRACKING_SMS",
              message: `Suraksha Setu Update: Your accident case has been registered successfully. Track status here: ${trackingUrl}`,
              trackingLink: trackingUrl,
              status: smsResult.success ? "SENT" : "FAILED",
            },
          });

          if (!smsResult.success) {
            console.error(
              `[SMS] Failed for case ${caseId}: ${smsResult.error}`
            );
          }
        } else {
          console.warn(
            `[Tracking] No phone number found for case ${caseId} — SMS skipped.`
          );
        }
      } catch (smsErr: unknown) {
        // SMS errors must never break the case workflow
        const msg = smsErr instanceof Error ? smsErr.message : String(smsErr);
        console.error(`[SMS] Unexpected error for case ${caseId}: ${msg}`);
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    await prisma.auditLog.create({
      data: {
        action: "HOSPITAL_STATUS_UPDATE",
        entityType: "ACCIDENT_CASE",
        entityId: caseId,
        userId: session.user.id,
        role: "HOSPITAL",
        details: `Hospital status updated to ${status}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hospital Prepare PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
