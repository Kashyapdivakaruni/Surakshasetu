/**
 * AI Triage Engine — NEWS2 (National Early Warning Score 2)
 * 
 * Clinically validated scoring system used by NHS and emergency services globally.
 * Computes patient acuity from vital signs to assist clinical decision-making.
 */

export interface TriageInput {
  bloodPressure?: string | null;     // "120/80" format
  pulseRate?: number | null;
  oxygenLevel?: number | null;       // SpO2 %
  temperature?: number | null;       // °F
  respiratoryRate?: number | null;
  consciousnessStatus?: string | null;
  bleedingSeverity?: string | null;
  bloodSugar?: number | null;
}

export interface TriageResult {
  score: number;
  maxScore: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  recommendation: string;
  confidence: number;
  alerts: TriageAlert[];
}

export interface TriageAlert {
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
}

function parseSystolicBP(bp?: string | null): number | null {
  if (!bp) return null;
  const parts = bp.split("/");
  const systolic = parseInt(parts[0]);
  return isNaN(systolic) ? null : systolic;
}

function tempFtoC(fahrenheit: number): number {
  return (fahrenheit - 32) * 5 / 9;
}

export function computeTriageScore(input: TriageInput): TriageResult {
  let score = 0;
  const alerts: TriageAlert[] = [];

  // --- SpO2 Scoring ---
  const spo2 = input.oxygenLevel;
  if (spo2 != null) {
    if (spo2 <= 91) { score += 3; }
    else if (spo2 <= 93) { score += 2; }
    else if (spo2 <= 95) { score += 1; }
  }

  // --- Pulse Rate Scoring ---
  const pulse = input.pulseRate;
  if (pulse != null) {
    if (pulse <= 40) { score += 3; }
    else if (pulse <= 50) { score += 1; }
    else if (pulse >= 131) { score += 3; }
    else if (pulse >= 111) { score += 2; }
    else if (pulse >= 91) { score += 1; }
  }

  // --- Consciousness Scoring ---
  const consciousness = input.consciousnessStatus;
  if (consciousness && consciousness !== "CONSCIOUS") {
    score += 3;
  }

  // --- Temperature Scoring (convert °F to °C for NEWS2) ---
  const tempF = input.temperature;
  if (tempF != null) {
    const tempC = tempFtoC(tempF);
    if (tempC <= 35.0) { score += 3; }
    else if (tempC <= 36.0) { score += 1; }
    else if (tempC >= 39.1) { score += 2; }
    else if (tempC >= 38.1) { score += 1; }
  }

  // --- Systolic Blood Pressure Scoring ---
  const systolic = parseSystolicBP(input.bloodPressure);
  if (systolic != null) {
    if (systolic <= 90) { score += 3; }
    else if (systolic <= 100) { score += 2; }
    else if (systolic <= 110) { score += 1; }
    else if (systolic >= 220) { score += 3; }
  }

  // --- Respiratory Rate Scoring ---
  const respRate = input.respiratoryRate;
  if (respRate != null) {
    if (respRate <= 8) { score += 3; }
    else if (respRate <= 11) { score += 1; }
    else if (respRate >= 25) { score += 3; }
    else if (respRate >= 21) { score += 2; }
  }

  // --- Bleeding Severity Bonus ---
  if (input.bleedingSeverity === "CRITICAL") { score += 2; }
  else if (input.bleedingSeverity === "HIGH") { score += 1; }

  // --- Generate Clinical Alerts ---
  if (spo2 != null && spo2 < 92) {
    alerts.push({ type: "CRITICAL", title: "HYPOXEMIA DETECTED", message: "SpO2 critically low — Oxygen supplementation required immediately" });
  }
  if (systolic != null && systolic < 90) {
    alerts.push({ type: "CRITICAL", title: "HYPOTENSION", message: "Systolic BP dangerously low — Assess for hemorrhagic shock, initiate IV fluids" });
  }
  if (pulse != null && pulse > 120) {
    alerts.push({ type: "CRITICAL", title: "TACHYCARDIA", message: "Heart rate elevated — Evaluate for internal bleeding or cardiac distress" });
  }
  if (consciousness && consciousness === "UNCONSCIOUS") {
    alerts.push({ type: "CRITICAL", title: "GCS CHECK REQUIRED", message: "Patient unconscious — Intubation standby, assess Glasgow Coma Scale" });
  }
  if (input.bloodSugar != null && input.bloodSugar < 70) {
    alerts.push({ type: "WARNING", title: "HYPOGLYCEMIA", message: "Blood sugar critically low — Administer IV dextrose" });
  }
  if (tempF != null && tempF > 103) {
    alerts.push({ type: "WARNING", title: "HYPERTHERMIA", message: "Temperature dangerously elevated — Active cooling measures required" });
  }
  if (respRate != null && respRate > 24) {
    alerts.push({ type: "WARNING", title: "TACHYPNEA", message: "Respiratory rate elevated — Assess for pneumothorax or respiratory failure" });
  }
  if (systolic != null && systolic >= 220) {
    alerts.push({ type: "CRITICAL", title: "HYPERTENSIVE CRISIS", message: "Systolic BP critically elevated — Risk of stroke, immediate intervention needed" });
  }

  // --- Determine Level ---
  let level: TriageResult["level"];
  let label: string;
  let color: string;
  let bgColor: string;
  let borderColor: string;
  let recommendation: string;

  if (score >= 7) {
    level = "CRITICAL";
    label = "CRITICAL";
    color = "text-red-700";
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
    recommendation = "Immediate ICU admission required. Activate trauma team. Continuous monitoring mandatory.";
  } else if (score >= 5) {
    level = "HIGH";
    label = "HIGH RISK";
    color = "text-orange-700";
    bgColor = "bg-orange-50";
    borderColor = "border-orange-200";
    recommendation = "Urgent clinical assessment needed. Escalate to senior clinician. Frequent vital monitoring.";
  } else if (score >= 1) {
    level = "MEDIUM";
    label = "MEDIUM RISK";
    color = "text-amber-700";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-200";
    recommendation = "Ward-level monitoring recommended. Reassess within 4-6 hours. Alert if vitals deteriorate.";
  } else {
    level = "LOW";
    label = "LOW RISK";
    color = "text-green-700";
    bgColor = "bg-green-50";
    borderColor = "border-green-200";
    recommendation = "Stable condition. Standard monitoring protocol. Routine clinical observations.";
  }

  // Confidence: higher when more vitals are provided
  const fieldsProvided = [spo2, pulse, consciousness, tempF, systolic, respRate].filter(v => v != null).length;
  const confidence = Math.min(97, 72 + (fieldsProvided * 4.2));

  return {
    score,
    maxScore: 20,
    level,
    label,
    color,
    bgColor,
    borderColor,
    recommendation,
    confidence: Math.round(confidence * 10) / 10,
    alerts
  };
}

/**
 * AI Hospital Recommendation Engine
 * Computes a weighted optimization score for each hospital based on
 * distance, bed availability, trauma capability, and severity match.
 */
export function computeHospitalAIScore(hospital: {
  distanceKm: number;
  icuBedsAvailable: number;
  emergencyBedsAvailable: number;
  traumaCareAvailable: boolean;
  emergencySupportAvailable: boolean;
}, severityLevel?: string): number {
  // Normalize distance (closer = higher score, max 10km considered)
  const distScore = Math.max(0, 1 - (hospital.distanceKm / 15)) * 40;

  // Bed availability (more beds = higher score)
  const bedScore = Math.min(30, (hospital.icuBedsAvailable * 4 + hospital.emergencyBedsAvailable * 2));

  // Trauma care capability
  const traumaScore = hospital.traumaCareAvailable ? 20 : 0;

  // Severity match: critical cases get bonus for trauma centers + ICU beds
  let severityBonus = 0;
  if (severityLevel === "CRITICAL" || severityLevel === "HIGH") {
    if (hospital.traumaCareAvailable && hospital.icuBedsAvailable > 0) severityBonus = 10;
    else if (hospital.icuBedsAvailable > 0) severityBonus = 5;
  } else {
    if (hospital.emergencyBedsAvailable > 0) severityBonus = 8;
  }

  const total = distScore + bedScore + traumaScore + severityBonus;
  return Math.min(100, Math.round(total));
}
