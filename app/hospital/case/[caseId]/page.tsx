"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, HeartPulse, Activity, AlertTriangle, Camera, CheckCircle2, MapPin, Ambulance, Brain, Shield, Loader2, X, Printer, FileText } from "lucide-react";
import { computeTriageScore } from "@/lib/aiTriage";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { VideoCallButton } from "@/components/video/VideoCallButton";
import QRCode from "react-qr-code";

export default function HospitalCasePage({ params }: { params: { caseId: string } }) {
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPassengerDetails, setSelectedPassengerDetails] = useState<any>(null);
  const [selectedVitalsPassenger, setSelectedVitalsPassenger] = useState<string>("PRIMARY");

  const fetchCase = async (isPoll = false) => {
    try {
      const res = await fetch(`/api/hospital/case/${params.caseId}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data.emergencyCase);
        if (data.hospitalProfile) {
          setHospitalProfile(data.hospitalProfile);
        }
      }
    } catch (err) {
      console.error("Failed to fetch case details");
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchCase();
    const interval = setInterval(() => {
      fetchCase(true);
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [params.caseId]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/hospital/prepare/${params.caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ title: "Status Updated", description: `Case marked as ${newStatus}`, type: "success" });
        fetchCase(true);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // Evidence score calculation
  const getEvidenceScoreDetails = () => {
    const details = {
      emsVerified: false,
      gpsVerified: false,
      hospitalVerified: false,
      policeVerified: false,
      score: 0
    };

    if (!caseData) return details;

    // 1. EMS Verification (identity is verified/partial or vitals logged)
    if (caseData.identityStatus === "VERIFIED" || caseData.identityStatus === "PARTIAL" || (caseData.emsVitals && caseData.emsVitals.length > 0)) {
      details.emsVerified = true;
      details.score += 25;
    }

    // 2. GPS Verification (lat & lng coordinates are logged)
    if (caseData.accidentLatitude !== null && caseData.accidentLongitude !== null) {
      details.gpsVerified = true;
      details.score += 25;
    }

    // 3. Hospital Verification (patient status is ADMITTED, UNDER_TREATMENT, STABLE, CRITICAL)
    const hStatus = caseData.hospitalResponses?.[0]?.status || "NOTIFIED";
    if (["ADMITTED", "UNDER_TREATMENT", "STABLE", "CRITICAL"].includes(hStatus)) {
      details.hospitalVerified = true;
      details.score += 25;
    }

    // 4. Police Verification (police report attached / FIR registered)
    if (caseData.policeReports && caseData.policeReports.length > 0) {
      details.policeVerified = true;
      details.score += 25;
    }

    return details;
  };

  const handlePrintClaimPackage = () => {
    const printContent = document.getElementById('insurance-claim-package')?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Insurance Claim Evidence Package - ' + params.caseId.substring(0, 8).toUpperCase() + '</title>');
    
    // Copy stylesheets
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      printWindow.document.write(node.outerHTML);
    });
    
    printWindow.document.write('</head><body class="bg-white p-8">');
    printWindow.document.write(printContent || '');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading full emergency case data...</div>;
  if (!caseData) return <div className="p-10 text-center text-slate-500 font-medium">Case not found or not assigned to your hospital.</div>;

  const p = caseData.citizen;
  const vitalsArray = caseData.emsVitals || [];
  const images = caseData.uploadedFiles || [];
  const status = caseData.hospitalResponses?.[0]?.status || "NOTIFIED";

  // Get unique latest vitals per passenger
  const uniqueVitalsMap = new Map();
  vitalsArray.forEach((v: any) => {
    if (!uniqueVitalsMap.has(v.passengerId)) {
      uniqueVitalsMap.set(v.passengerId, v);
    }
  });
  const uniqueVitals = Array.from(uniqueVitalsMap.values());

  const getPassengerName = (v: any) => {
    if (v.passengerId === "PRIMARY") return p?.user?.fullName || caseData.manualPatientName || "Primary Patient";
    if (v.patientName && v.patientName !== "Unknown Passenger") return v.patientName;
    const pass = p?.passengers?.find((passObj: any) => passObj.id === v.passengerId);
    return pass?.name || "Unknown Passenger";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/hospital/dashboard">
            <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F284B] tracking-tight">Case #{params.caseId.substring(0,8).toUpperCase()}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-red-600 font-bold text-sm animate-pulse flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" /> {caseData.severityLevel} EMERGENCY
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-600 uppercase">
                {caseData.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "NOTIFIED" && (
            <>
              <Button disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 shadow-md" onClick={() => updateStatus("PREPARING")}>
                ✅ Accept & Prepare for Patient
              </Button>
              <Button disabled={updating} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-full px-6 shadow-sm" onClick={() => updateStatus("DECLINED")}>
                ❌ Decline Case
              </Button>
            </>
          )}
          {status === "PREPARING" && (
            <>
              <div className="bg-blue-100 border border-blue-200 text-blue-800 font-bold px-4 py-2 rounded-full flex items-center shadow-sm text-sm">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> PREPARING...
              </div>
              <Button disabled={updating} className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full px-6 shadow-md" onClick={() => updateStatus("ADMITTED")}>
                Mark Patient Admitted
              </Button>
            </>
          )}
          {(status === "ADMITTED" || status === "UNDER_TREATMENT" || status === "STABLE") && (
            <div className="bg-green-100 border border-green-200 text-green-800 font-bold px-6 py-2 rounded-full flex items-center shadow-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" /> PATIENT {status === "ADMITTED" ? "ADMITTED" : status.replace("_", " ")}
            </div>
          )}
          {status === "CRITICAL" && (
            <div className="bg-red-100 border border-red-200 text-red-800 font-bold px-6 py-2 rounded-full flex items-center shadow-sm animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-2" /> PATIENT CRITICAL
            </div>
          )}
          {["ADMITTED", "UNDER_TREATMENT", "STABLE", "CRITICAL"].includes(status) && (
            <Button onClick={() => setShowClaimModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-6 shadow-md flex items-center gap-2">
              <FileText className="w-4 h-4" /> Generate Claim Package
            </Button>
          )}
          {status === "DECLINED" && (
            <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-6 py-2 rounded-full flex items-center shadow-sm">
              <X className="w-4 h-4 mr-2" /> CASE DECLINED
            </div>
          )}
          {status !== "NOTIFIED" && status !== "DECLINED" && (
            <VideoCallButton
              caseId={params.caseId}
              userRole="HOSPITAL"
              roomExists={!!caseData.hospitalResponses?.[0]?.videoRoomId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md"
            />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F284B]">
                <User className="w-5 h-5 text-blue-600" /> Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500 font-bold mb-1">FULL NAME</div>
                <div className="font-extrabold text-xl text-slate-900">
                  {caseData.identityStatus === "UNVERIFIED" && caseData.manualPatientName ? (
                    <span className="text-orange-600">{caseData.manualPatientName} (Unverified)</span>
                  ) : (
                    p?.user?.fullName || "Unknown"
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold mb-1">AGE & GENDER</div>
                <div className="font-bold text-lg">
                  {caseData.identityStatus === "UNVERIFIED" && caseData.manualPatientAge ? (
                    <span className="text-orange-600">~{caseData.manualPatientAge} Yrs • {caseData.manualPatientGender || "?"}</span>
                  ) : (
                    `${p?.age || "?"} Yrs • ${p?.gender || "?"}`
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold mb-1">BLOOD GROUP</div>
                <div className="font-bold text-red-600 text-2xl">{p?.bloodGroup || "?"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500 font-bold mb-1">EMERGENCY CONTACT</div>
                <div className="font-bold text-slate-800">{p?.emergencyContactName || "Not Provided"}</div>
                <div className="text-sm text-slate-500 font-medium">{p?.emergencyContactPhone || ""}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500 font-bold mb-1">VEHICLE INVOLVED</div>
                <div className="font-bold text-slate-800">{caseData.vehicle?.vehicleNumber || "Unknown"}</div>
              </div>
            </CardContent>
          </Card>

          {p?.passengers?.length > 0 && (
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-lg flex items-center gap-2 text-[#0F284B]">
                  <User className="w-5 h-5 text-indigo-600" /> Co-Passengers Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-4">
                  {p.passengers.map((pass: any) => (
                    <div key={pass.id} className="bg-white border border-slate-200 p-4 rounded-xl flex gap-4 shadow-sm">
                      {pass.photo ? (
                        <img src={pass.photo} alt={pass.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-2 border-slate-200">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 truncate">{pass.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{pass.relationship} • {pass.age} Yrs • {pass.gender}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {pass.bloodGroup && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{pass.bloodGroup}</span>
                            )}
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 uppercase" onClick={() => setSelectedPassengerDetails(pass)}>View History</Button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs space-y-1">
                          {pass.healthConditions && <p className="truncate"><span className="font-bold text-slate-600">Conditions:</span> {pass.healthConditions}</p>}
                          {pass.allergies && <p className="truncate"><span className="font-bold text-slate-600">Allergies:</span> <span className="text-orange-600 font-medium">{pass.allergies}</span></p>}
                          {pass.emergencyContactName && (
                            <p className="truncate"><span className="font-bold text-slate-600">Contact:</span> {pass.emergencyContactName} ({pass.emergencyContactPhone})</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-red-50 bg-red-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <HeartPulse className="w-5 h-5" /> Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-red-800/60 font-bold mb-1">KNOWN ALLERGIES</div>
                {p?.medicalInfo?.allergies ? (
                  <div className="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded inline-block border border-red-100">{p.medicalInfo.allergies}</div>
                ) : <div className="font-medium text-slate-500 text-sm">None declared</div>}
              </div>
              <div>
                <div className="text-xs text-red-800/60 font-bold mb-1">PREVIOUS CONDITIONS</div>
                <div className="font-bold text-slate-800">{p?.medicalInfo?.previousConditions || "None declared"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-red-800/60 font-bold mb-1">CURRENT MEDICATIONS</div>
                <div className="font-bold text-slate-800">{p?.medicalInfo?.currentMedications || "None declared"}</div>
              </div>
              {p?.medicalInfo?.notes && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-red-800/60 font-bold mb-1">CITIZEN MEDICAL NOTES</div>
                  <div className="font-medium text-red-800 bg-red-50 p-3 rounded-xl border border-red-100">{p.medicalInfo.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {images.filter((img: any) => img.passengerId === selectedVitalsPassenger).length > 0 && (
            <Card className="border-indigo-100 shadow-sm rounded-2xl overflow-hidden mt-6">
              <CardHeader className="pb-3 border-b border-indigo-50 bg-indigo-50/50">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                  <Camera className="w-5 h-5" /> Uploaded Medical Readings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex gap-4 flex-wrap">
                {images.filter((img: any) => img.passengerId === selectedVitalsPassenger).map((img: any, i: number) => (
                  <div 
                    key={img.id} 
                    className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all"
                    onClick={() => setSelectedImage(img.dataUrl)}
                  >
                    <Image src={img.dataUrl} alt={img.fileName || "Medical reading"} layout="fill" objectFit="cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 text-[10px] text-white font-bold truncate text-center backdrop-blur-sm">
                      {img.fileName || `Reading ${i+1}`}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-orange-100 bg-orange-50/80">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                <Activity className="w-5 h-5 text-orange-600" /> Latest EMS Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {uniqueVitals.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-orange-100">
                  {uniqueVitals.map((v: any) => (
                    <Button 
                      key={v.passengerId}
                      size="sm"
                      variant={selectedVitalsPassenger === v.passengerId ? "default" : "outline"}
                      onClick={() => setSelectedVitalsPassenger(v.passengerId)}
                      className={`rounded-full whitespace-nowrap font-bold ${selectedVitalsPassenger === v.passengerId ? 'bg-orange-600 text-white' : 'text-orange-800 bg-white border-orange-200'}`}
                    >
                      {getPassengerName(v)}
                    </Button>
                  ))}
                </div>
              )}
              
              {uniqueVitals.length > 0 ? (
                uniqueVitals.filter((v: any) => selectedVitalsPassenger ? v.passengerId === selectedVitalsPassenger : true).slice(0, 1).map((vitals: any) => {
                const triage = computeTriageScore({
                  bloodPressure: vitals.bloodPressure,
                  pulseRate: vitals.pulseRate,
                  oxygenLevel: vitals.oxygenLevel,
                  temperature: vitals.temperature,
                  respiratoryRate: vitals.respiratoryRate,
                  consciousnessStatus: vitals.consciousnessStatus,
                  bleedingSeverity: vitals.bleedingSeverity,
                  bloodSugar: vitals.bloodSugar
                });
                return (
                <div key={vitals.id} className="space-y-5">
                  {/* AI Triage Badge */}
                  <div className={`p-4 rounded-xl border-2 ${triage.borderColor} ${triage.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain className={`w-6 h-6 ${triage.color}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-extrabold text-lg ${triage.color}`}>AI Triage: {triage.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                              triage.level === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 
                              triage.level === 'HIGH' ? 'bg-orange-500' : 
                              triage.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'
                            }`}>{triage.score}/{triage.maxScore}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{triage.recommendation}</p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                          <Shield className="w-3 h-3" /> {triage.confidence}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Enhanced NEWS2</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Clinical Alerts */}
                  {triage.alerts.length > 0 && (
                    <div className="space-y-2">
                      {triage.alerts.map((alert: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 text-sm ${
                          alert.type === 'CRITICAL' ? 'border-l-red-600 bg-red-50 text-red-800' : 'border-l-amber-500 bg-amber-50 text-amber-800'
                        }`}>
                          <span className="font-extrabold">{alert.type === 'CRITICAL' ? '🚨' : '⚠️'} {alert.title}:</span> {alert.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">BP (mmHg)</div>
                      <div className="font-mono text-xl font-black text-slate-800">{vitals.bloodPressure || "--"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">HEART RATE</div>
                      <div className="font-mono text-xl font-black text-red-600">{vitals.pulseRate || "--"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">SpO2</div>
                      <div className="font-mono text-xl font-black text-slate-800">{vitals.oxygenLevel ? `${vitals.oxygenLevel}%` : "--"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">TEMP</div>
                      <div className="font-mono text-xl font-black text-slate-800">{vitals.temperature ? `${vitals.temperature}°F` : "--"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">RESP RATE</div>
                      <div className="font-mono text-xl font-black text-slate-800">{vitals.respiratoryRate ? `${vitals.respiratoryRate} bpm` : "--"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">BLOOD SUGAR</div>
                      <div className="font-mono text-xl font-black text-slate-800">{vitals.bloodSugar ? `${vitals.bloodSugar} mg/dL` : "--"}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">CONSCIOUSNESS</div>
                      <div className="font-bold text-slate-800">{vitals.consciousnessStatus?.replace("_", " ")}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                      <div className="text-xs text-slate-500 font-bold mb-1">BLEEDING SEVERITY</div>
                      <div className={`font-bold ${
                        vitals.bleedingSeverity === 'CRITICAL' ? 'text-red-700' : 
                        vitals.bleedingSeverity === 'HIGH' ? 'text-red-500' :
                        vitals.bleedingSeverity === 'MEDIUM' ? 'text-orange-500' : 'text-slate-800'
                      }`}>
                        {vitals.bleedingSeverity || "NONE"}
                      </div>
                    </div>
                  </div>

                  {(vitals.injuryObservations || vitals.emergencyNotes || vitals.fractureDetails) && (
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <div className="font-bold text-orange-900 flex items-center gap-2 mb-2 text-sm">
                        <AlertTriangle className="w-4 h-4" /> EMS Notes & Injuries
                      </div>
                      <div className="space-y-2 text-sm text-slate-700 font-medium">
                        {vitals.injuryObservations && <p><strong>Injuries:</strong> {vitals.injuryObservations}</p>}
                        {vitals.fractureDetails && <p><strong>Fractures:</strong> <span className="text-red-600">{vitals.fractureDetails}</span></p>}
                        {vitals.emergencyNotes && <p className="italic bg-orange-50/50 p-2 rounded">"{vitals.emergencyNotes}"</p>}
                      </div>
                    </div>
                  )}
                </div>
                );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 font-medium text-sm">
                  EMS has not logged vitals yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F284B]">
                <Ambulance className="w-5 h-5 text-indigo-600" /> Dispatch Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-bold mb-1">ACCIDENT LOCATION</div>
                <div className="font-medium text-slate-800 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  {caseData.accidentAddress || "Unknown"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">ASSIGNED EMS UNIT</div>
                  <div className="font-bold text-slate-800">EMS First Responders</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">EMERGENCY SEVERITY</div>
                  <div className={`font-bold ${
                    caseData.severityLevel === 'CRITICAL' ? 'text-red-700' : 
                    caseData.severityLevel === 'HIGH' ? 'text-orange-600' : 'text-slate-800'
                  }`}>
                    {caseData.severityLevel}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-bold mb-1">CURRENT AMBULANCE STATUS</div>
                <div className="font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 uppercase">
                  {caseData.status.replace("_", " ")}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center mt-2">
                <span className="text-sm font-bold text-slate-600">AMBULANCE ETA</span>
                <span className="font-bold text-xl text-indigo-700">{caseData.ambulanceEtaMinutes || ((caseData.id.charCodeAt(0) || 0) % 15) + 5} MINS</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button variant="outline" className="bg-black/50 text-white border-white/20 hover:bg-black" onClick={() => setSelectedImage(null)}>Close</Button>
            </div>
            <div className="relative flex-1">
              <Image src={selectedImage} alt="Medical reading full size" layout="fill" objectFit="contain" />
            </div>
          </div>
        </div>
      )}

      {/* Passenger Full Details Modal */}
      {selectedPassengerDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-0">
              <div className="bg-[#0F284B] p-4 text-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-xl">Passenger History</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPassengerDetails(null)} className="text-white hover:bg-white/20">Close</Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  {selectedPassengerDetails.photo ? (
                    <img src={selectedPassengerDetails.photo} alt="Passenger" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-2xl text-slate-900">{selectedPassengerDetails.name}</h3>
                    <p className="text-slate-500 font-medium">{selectedPassengerDetails.relationship} • {selectedPassengerDetails.age} Yrs • {selectedPassengerDetails.gender}</p>
                    {selectedPassengerDetails.bloodGroup && (
                      <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 font-bold rounded-md text-sm border border-red-200">
                        Blood: {selectedPassengerDetails.bloodGroup}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#0F284B] mb-3 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-500" /> Medical History
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Existing Conditions</p>
                      <p className="font-medium text-slate-800">{selectedPassengerDetails.healthConditions || "None declared"}</p>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase">Known Allergies</p>
                      <p className="font-medium text-red-700">{selectedPassengerDetails.allergies || "None declared"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#0F284B] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Emergency Contacts
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    {selectedPassengerDetails.emergencyContactName ? (
                      <div>
                        <p className="font-bold text-orange-900">{selectedPassengerDetails.emergencyContactName}</p>
                        <p className="font-medium text-orange-800 text-lg mt-1">{selectedPassengerDetails.emergencyContactPhone}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-800 italic">No emergency contact provided.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insurance Claim Evidence Package Modal */}
      {showClaimModal && caseData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0F284B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold">Insurance Evidence Package</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handlePrintClaimPackage} 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full px-5 h-10 shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowClaimModal(false)} 
                  className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div 
                id="insurance-claim-package" 
                className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm font-sans max-w-3xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none"
              >
                {/* 1. Header (Letterhead) */}
                <div className="border-b-2 border-slate-200 pb-6 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#0F284B]">
                      <Shield className="w-8 h-8 text-indigo-600 shrink-0" />
                      <span className="text-2xl font-black tracking-tight">SURAKSHA SETU</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Secure Emergency Response Network</p>
                    <div className="mt-3 inline-block bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                      Official Incident Evidence Package
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reference ID</p>
                    <p className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded border">
                      SS-CASE-{caseData.id.substring(0,8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold pt-1">
                      Generated: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 2. Official Disclaimer */}
                <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 font-medium leading-relaxed">
                    <strong>Official Submission Disclaimer:</strong> This package serves as consolidated, verified clinical and incident supporting evidence of emergency response and hospital admission. This is <strong>not</strong> an insurance claim approval, policy coverage guarantee, or decision document.
                  </div>
                </div>

                {/* 3. Evidence Verification Score & Summary Checklist */}
                <div className="grid md:grid-cols-3 gap-6 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-6">
                  {/* Score Indicator */}
                  <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-indigo-100/50 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Evidence Score</span>
                    <div className="relative flex items-center justify-center my-3">
                      <div className="text-4xl font-black text-[#0F284B]">
                        {getEvidenceScoreDetails().score}<span className="text-lg text-slate-400">/100</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                      getEvidenceScoreDetails().score === 100 ? 'bg-green-600' :
                      getEvidenceScoreDetails().score >= 75 ? 'bg-blue-600' :
                      getEvidenceScoreDetails().score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {getEvidenceScoreDetails().score === 100 ? 'Fully Verified' :
                       getEvidenceScoreDetails().score >= 75 ? 'Highly Reliable' :
                       getEvidenceScoreDetails().score >= 50 ? 'Medium Credibility' : 'Low Evidence'}
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="md:col-span-2 space-y-2.5">
                    <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider mb-3">Verification Checkpoints</h4>
                    
                    <div className="flex items-center justify-between text-xs border-b border-indigo-100/50 pb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceScoreDetails().emsVerified ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">✗</div>
                        )}
                        <span className="font-bold text-slate-700">1. EMS Triage & Vitals Logged</span>
                      </div>
                      <span className="font-bold text-slate-500">{getEvidenceScoreDetails().emsVerified ? 'Verified (+25%)' : 'Awaiting (-)'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-indigo-100/50 pb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceScoreDetails().gpsVerified ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">✗</div>
                        )}
                        <span className="font-bold text-slate-700">2. Incident GPS Geolocation Match</span>
                      </div>
                      <span className="font-bold text-slate-500">{getEvidenceScoreDetails().gpsVerified ? 'Verified (+25%)' : 'Awaiting (-)'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-indigo-100/50 pb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceScoreDetails().hospitalVerified ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">✗</div>
                        )}
                        <span className="font-bold text-slate-700">3. Hospital Admission Record Verified</span>
                      </div>
                      <span className="font-bold text-slate-500">{getEvidenceScoreDetails().hospitalVerified ? 'Verified (+25%)' : 'Awaiting (-)'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-1">
                      <div className="flex items-center gap-2">
                        {getEvidenceScoreDetails().policeVerified ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">✗</div>
                        )}
                        <span className="font-bold text-slate-700">4. Police Report / FIR Attached</span>
                      </div>
                      <span className="font-bold text-slate-500">{getEvidenceScoreDetails().policeVerified ? 'Verified (+25%)' : 'Awaiting (-)'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Verification Summary Board */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Claim Verification Summary
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs font-medium">
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">PATIENT NAME</p>
                      <p className="text-slate-900 font-extrabold">{p?.user?.fullName || caseData.manualPatientName || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">ADMITTING HOSPITAL</p>
                      <p className="text-slate-900 font-extrabold">{hospitalProfile?.hospitalName || "Suraksha Network Hospital"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">ADMITTING DOCTOR</p>
                      <p className="text-slate-900 font-extrabold">{caseData.hospitalResponses?.[0]?.doctorAssigned || "On Duty Medical Staff"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">WARD & BED ASSIGNED</p>
                      <p className="text-slate-900 font-extrabold">{caseData.hospitalResponses?.[0]?.bedNumber || "Emergency Ward"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">ADMISSION TIMESTAMP</p>
                      <p className="text-slate-900 font-extrabold">
                        {caseData.hospitalResponses?.[0]?.updatedAt ? new Date(caseData.hospitalResponses[0].updatedAt).toLocaleString() : new Date(caseData.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">POLICE FIR STATUS</p>
                      <p className={`font-extrabold ${caseData.policeReports?.length > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                        {caseData.policeReports?.[0]?.firNumber ? `FIR Registered (#${caseData.policeReports[0].firNumber})` : 'Not Registered'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. QR Code & Verify link */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="bg-white p-2.5 rounded-lg border shadow-sm">
                    {appUrl && (
                      <QRCode
                        value={`${appUrl}/track/${caseData.id}`}
                        size={100}
                        level="M"
                        fgColor="#0F284B"
                      />
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h5 className="font-extrabold text-[#0F284B] text-sm flex items-center justify-center sm:justify-start gap-1">
                      <Shield className="w-4 h-4 text-green-600" /> Digital Verification Link
                    </h5>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Insurance claims adjusters can scan the QR code to review the live emergency event logs, GPS logs, ambulance dispatch timeline, and verify details on the secure platform.
                    </p>
                    <p className="text-[10px] font-mono text-indigo-600 font-bold break-all pt-1">
                      {appUrl}/track/{caseData.id}
                    </p>
                  </div>
                </div>

                {/* 6. Patient Demographics & Profile */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider border-b-2 border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" /> Patient Demographics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">FULL NAME</p>
                      <p className="text-slate-800 font-bold">{p?.user?.fullName || caseData.manualPatientName || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">AGE & GENDER</p>
                      <p className="text-slate-800 font-bold">
                        {p?.age ? `${p.age} Yrs` : caseData.manualPatientAge ? `${caseData.manualPatientAge} Yrs (manual)` : '?'} • {p?.gender || caseData.manualPatientGender || '?'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">BLOOD GROUP</p>
                      <p className="text-red-600 font-extrabold text-sm">{p?.bloodGroup || "?"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">ORGAN DONOR STATUS</p>
                      <p className="text-slate-800 font-bold">{p?.organDonorStatus ? 'Registered Donor' : 'Not Declared'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 font-bold mb-0.5">ADDRESS</p>
                      <p className="text-slate-800 font-medium">{p?.address || "Not Provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 font-bold mb-0.5">EMERGENCY CONTACT</p>
                      <p className="text-slate-800 font-bold">
                        {p?.emergencyContactName || "Not Provided"} {p?.emergencyContactPhone ? `(${p.emergencyContactPhone})` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 7. EMS Scene & Triage Details */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider border-b-2 border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-orange-600" /> First Responder (EMS) Incident Report
                  </h4>
                  
                  {caseData.emsVitals && caseData.emsVitals.length > 0 ? (
                    <div className="space-y-4">
                      {/* Vitals Grid Table */}
                      <div className="bg-slate-50 border rounded-xl overflow-hidden p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</span>
                            <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{caseData.emsVitals[0].bloodPressure || "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Heart Pulse</span>
                            <p className="font-mono text-sm font-black text-red-600 mt-0.5">{caseData.emsVitals[0].pulseRate ? `${caseData.emsVitals[0].pulseRate} bpm` : "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Oxygen (SpO2)</span>
                            <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{caseData.emsVitals[0].oxygenLevel ? `${caseData.emsVitals[0].oxygenLevel}%` : "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Temperature</span>
                            <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{caseData.emsVitals[0].temperature ? `${caseData.emsVitals[0].temperature}°F` : "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Respiratory Rate</span>
                            <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{caseData.emsVitals[0].respiratoryRate ? `${caseData.emsVitals[0].respiratoryRate} bpm` : "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Sugar</span>
                            <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{caseData.emsVitals[0].bloodSugar ? `${caseData.emsVitals[0].bloodSugar} mg/dL` : "--"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Consciousness</span>
                            <p className="text-xs font-bold text-slate-800 mt-1 uppercase">{caseData.emsVitals[0].consciousnessStatus || "UNKNOWN"}</p>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Bleeding Severity</span>
                            <p className={`text-xs font-black mt-1 uppercase ${
                              caseData.emsVitals[0].bleedingSeverity === 'CRITICAL' ? 'text-red-700 animate-pulse' :
                              caseData.emsVitals[0].bleedingSeverity === 'HIGH' ? 'text-red-600' :
                              caseData.emsVitals[0].bleedingSeverity === 'MEDIUM' ? 'text-orange-500' : 'text-slate-800'
                            }`}>{caseData.emsVitals[0].bleedingSeverity || "NONE"}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Triage Details */}
                      {(() => {
                        const triage = computeTriageScore({
                          bloodPressure: caseData.emsVitals[0].bloodPressure,
                          pulseRate: caseData.emsVitals[0].pulseRate,
                          oxygenLevel: caseData.emsVitals[0].oxygenLevel,
                          temperature: caseData.emsVitals[0].temperature,
                          respiratoryRate: caseData.emsVitals[0].respiratoryRate,
                          consciousnessStatus: caseData.emsVitals[0].consciousnessStatus,
                          bleedingSeverity: caseData.emsVitals[0].bleedingSeverity,
                          bloodSugar: caseData.emsVitals[0].bloodSugar
                        });
                        return (
                          <div className="bg-slate-50 border p-4 rounded-xl text-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-700 flex items-center gap-1.5"><Brain className="w-4 h-4 text-indigo-600" /> AI NEWS2 Diagnostic Result:</span>
                              <span className="font-extrabold bg-[#0F284B] text-white px-2 py-0.5 rounded text-[10px]">Triage Score: {triage.score}/20</span>
                            </div>
                            <div className="font-bold text-slate-800">
                              Risk Level: <span className={triage.level === 'CRITICAL' ? 'text-red-600 font-black' : triage.level === 'HIGH' ? 'text-orange-600' : 'text-green-600'}>{triage.label}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-semibold">Recommendation: {triage.recommendation}</p>
                            {caseData.emsVitals[0].emergencyNotes && (
                              <p className="text-slate-600 italic border-t pt-2 mt-2">"EMS Incident Notes: {caseData.emsVitals[0].emergencyNotes}"</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No vital logs recorded by EMS at scene.</p>
                  )}
                </div>

                {/* 8. Incident Details (Dispatch info) */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider border-b-2 border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" /> Incident Location & Dispatch Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">ACCIDENT ADDRESS</p>
                      <p className="text-slate-800 font-bold">{caseData.accidentAddress || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">GPS COORDINATES</p>
                      <p className="text-slate-800 font-mono">
                        {caseData.accidentLatitude !== null && caseData.accidentLongitude !== null ? 
                          `${caseData.accidentLatitude.toFixed(6)}, ${caseData.accidentLongitude.toFixed(6)}` : "Not Geolocated"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">INCIDENT SEVERITY LEVEL</p>
                      <p className="text-red-600 font-extrabold uppercase">{caseData.severityLevel || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold mb-0.5">VEHICLE DETAILS</p>
                      <p className="text-slate-800 font-bold">
                        {caseData.vehicle ? `${caseData.vehicle.vehicleNumber} (${caseData.vehicle.vehicleType})` : "No registered vehicle involved"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 9. Police verification details */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider border-b-2 border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-700" /> Police Incident Verification
                  </h4>
                  {caseData.policeReports && caseData.policeReports.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">FIR REFERENCE NUMBER</p>
                        <p className="text-slate-900 font-extrabold">#{caseData.policeReports[0].firNumber || "Not Filed"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">POLICE OFFICER IN CHARGE</p>
                        <p className="text-slate-800 font-bold">Officer ID: {caseData.policeReports[0].officerId}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">VEHICLE VERIFICATION STATUS</p>
                        <p className="text-slate-800 font-bold uppercase">{caseData.policeReports[0].vehicleVerificationStatus || "UNVERIFIED"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">INCIDENT DESCRIPTION</p>
                        <p className="text-slate-700 font-medium">{caseData.policeReports[0].accidentDescription || "No notes registered"}</p>
                      </div>
                      {caseData.policeReports[0].legalNotes && (
                        <div className="col-span-2 bg-yellow-50/50 border border-yellow-100 p-2.5 rounded text-slate-700">
                          <p className="text-slate-400 text-[10px] font-bold mb-0.5">OFFICIAL LEGAL NOTES</p>
                          <p className="font-medium">"{caseData.policeReports[0].legalNotes}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No official police incident reports are registered for this case yet.</p>
                  )}
                </div>

                {/* 10. Medical scans uploads (Thumbnails) */}
                {images.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-[#0F284B] uppercase tracking-wider border-b-2 border-slate-100 pb-1.5 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-teal-600" /> Uploaded Medical Attachments
                    </h4>
                    <div className="flex gap-4 flex-wrap pt-2 print:flex-nowrap">
                      {images.map((img: any, idx: number) => (
                        <div 
                          key={img.id} 
                          className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 print:border-2"
                        >
                          <img src={img.dataUrl} alt={img.fileName || `Reading ${idx+1}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[9px] text-white font-bold truncate text-center">
                            {img.fileName || `Scan ${idx+1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 11. Certified Seal & Signatures */}
                <div className="pt-8 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-8 text-center text-xs font-semibold">
                  <div className="flex flex-col items-center justify-end space-y-4">
                    <div className="w-24 h-24 rounded-full border-4 border-double border-indigo-200 bg-indigo-50/20 text-indigo-700/60 font-black flex flex-col items-center justify-center relative transform -rotate-12 select-none pointer-events-none mx-auto">
                      <Shield className="w-6 h-6 mb-0.5 text-indigo-600/40 mx-auto" />
                      <span className="text-[8px] font-bold tracking-widest text-[#0F284B]/60">SURAKSHA</span>
                      <span className="text-[8px] font-bold tracking-widest text-[#0F284B]/60">SETU NETWORK</span>
                      <span className="text-[7px] text-indigo-600/50">VERIFIED</span>
                    </div>
                    <div>
                      <p className="text-slate-400">NETWORK PROTOCOL SEAL</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Secure Ledger Sign-off</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-end space-y-6">
                    <div className="font-serif italic text-lg text-indigo-900 border-b border-slate-300 w-48 pb-1 tracking-wider">
                      {hospitalProfile?.hospitalName?.split(' ')[0] || 'Medical'} Staff
                    </div>
                    <div>
                      <p className="text-slate-400">AUTHORIZED HOSPITAL SIGNATURE</p>
                      <p className="text-slate-900 font-extrabold mt-0.5">{hospitalProfile?.hospitalName || "Suraksha Network Hospital"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
