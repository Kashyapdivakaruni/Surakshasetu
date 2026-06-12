import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { computeTriageScore } from "@/lib/aiTriage";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "EMS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;
    const data = await req.json();

    const existingCase = await prisma.accidentCase.findUnique({
      where: { id: caseId }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Compute AI Triage Score (NEWS2)
    const triage = computeTriageScore({
      bloodPressure: data.bloodPressure,
      pulseRate: data.pulseRate ? parseInt(data.pulseRate) : null,
      oxygenLevel: data.oxygenLevel ? parseInt(data.oxygenLevel) : null,
      temperature: data.temperature ? parseFloat(data.temperature) : null,
      respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
      consciousnessStatus: data.consciousnessStatus,
      bleedingSeverity: data.bleedingSeverity,
      bloodSugar: data.bloodSugar ? parseInt(data.bloodSugar) : null
    });

    // Save Vitals with AI Triage
    await prisma.eMSVitals.create({
      data: {
        caseId,
        emsId: session.user.id,
        passengerId: data.passengerId || "PRIMARY",
        patientName: data.patientName,
        bloodPressure: data.bloodPressure,
        pulseRate: data.pulseRate ? parseInt(data.pulseRate) : null,
        oxygenLevel: data.oxygenLevel ? parseInt(data.oxygenLevel) : null,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        bloodSugar: data.bloodSugar ? parseInt(data.bloodSugar) : null,
        bleedingSeverity: data.bleedingSeverity || null,
        fractureDetails: data.fractureDetails || null,
        consciousnessStatus: data.consciousnessStatus,
        injuryObservations: data.injuryObservations,
        emergencyNotes: data.emergencyNotes,
        triageScore: triage.score,
        triageLevel: triage.level,
        triageConfidence: triage.confidence
      }
    });

    // Save Images if any
    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        await prisma.uploadedFile.create({
          data: {
            caseId,
            uploadedById: session.user.id,
            passengerId: data.passengerId || "PRIMARY",
            fileType: "MEDICAL_DEVICE_IMAGE",
            fileName: img.fileName || "Device Image",
            dataUrl: img.dataUrl
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      triage: {
        score: triage.score,
        maxScore: triage.maxScore,
        level: triage.level,
        label: triage.label,
        recommendation: triage.recommendation,
        confidence: triage.confidence,
        alerts: triage.alerts
      }
    });
  } catch (error) {
    console.error("EMS Vitals POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

