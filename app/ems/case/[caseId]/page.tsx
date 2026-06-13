"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Activity, AlertTriangle, Building2, Car, HeartPulse, CheckCircle2, Loader2, ArrowLeft, Crosshair, MapPin, MessageSquare, X, ExternalLink, Phone, Shield, Bell, Stethoscope, BedDouble, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { VideoCallButton } from "@/components/video/VideoCallButton";

export default function EMSCasePage({ params }: { params: { caseId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsData, setSmsData] = useState<any>(null);
  const [smsSent, setSmsSent] = useState<boolean | null>(null);
  const [statusAlert, setStatusAlert] = useState<{show: boolean; status: string; hospitalName: string; details: string} | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const statusMessages: Record<string, { label: string; detail: string; color: string }> = {
    ADMITTED: { label: "Patient Admitted", detail: "ICU/Ward ready. Proceed to hospital immediately.", color: "green" },
    PREPARING: { label: "Hospital Preparing", detail: "Trauma team assembling. Bed being allocated.", color: "blue" },
    UNDER_TREATMENT: { label: "Under Treatment", detail: "Patient is receiving medical care.", color: "teal" },
    STABLE: { label: "Patient Stable", detail: "Vitals stabilized. Continuing monitoring.", color: "emerald" },
    CRITICAL: { label: "Patient Critical", detail: "Critical care escalation in progress.", color: "red" },
    DECLINED: { label: "Hospital Declined", detail: "Hospital unable to accept. Please reassign immediately.", color: "red" },
  };

  const fetchCase = async (isPoll = false) => {
    try {
      const res = await fetch(`/api/ems/case/${params.caseId}`);
      if (res.ok) {
        const data = await res.json();
        const ec = data.emergencyCase;
        
        // Detect hospital status change
        if (isPoll && ec.hospitalResponses?.length > 0) {
          const newStatus = ec.hospitalResponses[0]?.status;
          const hospitalName = ec.hospitalResponses[0]?.hospital?.hospitalName || "Assigned Hospital";
          
          if (prevStatusRef.current && newStatus !== prevStatusRef.current && newStatus !== "NOTIFIED") {
            const msg = statusMessages[newStatus];
            setStatusAlert({
              show: true,
              status: newStatus,
              hospitalName,
              details: msg?.detail || `Status updated to ${newStatus}`
            });
            // Auto-dismiss after 15 seconds
            setTimeout(() => setStatusAlert(null), 15000);
          }
          prevStatusRef.current = newStatus;
        } else if (ec.hospitalResponses?.length > 0) {
          prevStatusRef.current = ec.hospitalResponses[0]?.status;
        }
        
        setCaseData(ec);
        
        if (!ec.assignedHospitalId) {
          fetchHospitals();
        }
      }
    } catch (err) {
      console.error("Failed to fetch case");
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    const interval = setInterval(() => {
      fetchCase(true);
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [params.caseId]);

  const fetchHospitals = async () => {
    try {
      const res = await fetch("/api/ems/hospitals");
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals.slice(0, 3)); // Top 3
      }
    } catch (err) {
      console.error("Failed to fetch hospitals");
    }
  };

  const assignHospital = async (hospitalId: string, etaMinutes: number) => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/ems/case/${params.caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, ambulanceEtaMinutes: etaMinutes })
      });
      if (res.ok) {
        toast({ title: "Hospital Assigned", description: "Hospital notified and routing initiated.", type: "success" });
        // Refresh
        const refreshedRes = await fetch(`/api/ems/case/${params.caseId}`);
        const data = await refreshedRes.json();
        setCaseData(data.emergencyCase);
        
        const ec = data.emergencyCase;
        const emergencyContact = ec.citizen?.emergencyContactName || null;
        const emergencyPhone = ec.citizen?.user?.phone || ec.citizen?.emergencyContactPhone || null;
        const patientName = ec.citizen?.user?.fullName || ec.manualPatientName || "Unknown Patient";
        const hospitalName = ec.hospitalResponses?.[0]?.hospital?.hospitalName || "Assigned Hospital";

        // ── Send REAL SMS via Fast2SMS ───────────────────────────────────
        setSmsSent(null); // reset
        let trackingUrl = `${window.location.origin}/track/${params.caseId}`;
        try {
          const notifyRes = await fetch(`/api/ems/case/${params.caseId}/notify`, {
            method: "POST",
          });
          const notifyData = await notifyRes.json();
          if (notifyData.trackingUrl) trackingUrl = notifyData.trackingUrl;
          setSmsSent(notifyData.smsSent === true);
        } catch {
          setSmsSent(false);
        }
        // ────────────────────────────────────────────────────────────────

        setSmsData({
          contactName: emergencyContact || "Emergency Contact",
          contactPhone: emergencyPhone || "+91 XXXXXXXXXX",
          patientName,
          hospitalName,
          severity: ec.severityLevel || "HIGH",
          eta: ec.ambulanceEtaMinutes || "--",
          location: ec.accidentAddress || "Accident Location",
          trackingUrl
        });
        setShowSmsModal(true);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to assign hospital", type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const cancelAssignment = async () => {
    if (!confirm("Are you sure you want to cancel the current hospital assignment and pick a new one?")) return;
    
    setCancelling(true);
    try {
      const res = await fetch(`/api/ems/case/${params.caseId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast({ title: "Assignment Cancelled", description: "You can now select a different hospital.", type: "success" });
        setStatusAlert(null);
        prevStatusRef.current = null;
        fetchCase(); // Refetch to show the hospital list again
      } else {
        toast({ title: "Error", description: "Failed to cancel assignment", type: "error" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error while cancelling", type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading emergency case...</div>;
  if (!caseData) return <div className="p-10 text-center text-slate-500 font-medium">Case not found.</div>;

  const p = caseData.citizen;
  const isAssigned = !!caseData.assignedHospitalId;

  return (
    <>
    {/* SMS Simulation Modal */}
    {showSmsModal && smsData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${smsSent === false ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {smsSent === null ? "Sending SMS…" : smsSent ? "SMS Sent Successfully" : "SMS Could Not Be Sent"}
                </h3>
                <p className="text-white/80 text-xs font-medium">
                  {smsSent === null ? "Please wait…" : smsSent ? "Tracking link delivered via Fast2SMS" : "Check server logs — case is still active"}
                </p>
              </div>
            </div>
            <button onClick={() => setShowSmsModal(false)} className="text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recipient Info */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">{smsData.contactName}</div>
              <div className="text-xs text-slate-500 font-mono">{smsData.contactPhone}</div>
            </div>
            <div className="ml-auto">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                smsSent === null ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                smsSent ? 'bg-green-100 text-green-700 border-green-200' :
                'bg-red-100 text-red-700 border-red-200'
              }`}>
                {smsSent === null ? 'SENDING…' : smsSent ? 'DELIVERED' : 'FAILED'}
              </span>
            </div>
          </div>

          {/* SMS Body */}
          <div className="px-6 py-5">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 font-mono text-sm text-slate-700">
              <p className="font-bold text-red-600">⚠️ SURAKSHA SETU EMERGENCY ALERT</p>
              <p>
                <span className="font-bold">{smsData.patientName}</span> has been involved in a road accident{smsData.location !== "Accident Location" ? ` near ${smsData.location}` : ""}.
              </p>
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5">
                <p>🚑 EMS is on-site</p>
                <p>🚨 Severity: <span className={`font-bold ${
                  smsData.severity === 'CRITICAL' ? 'text-red-600' : 
                  smsData.severity === 'HIGH' ? 'text-orange-600' : 'text-amber-600'
                }`}>{smsData.severity}</span></p>
                <p>🏥 Hospital: <span className="font-bold text-slate-800">{smsData.hospitalName}</span></p>
                <p>⏱️ ETA: <span className="font-bold text-blue-600">{smsData.eta} minutes</span></p>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-3">
                <p>📍 Track ambulance live:</p>
                <p className="text-blue-600 font-bold break-all text-xs mt-1">{smsData.trackingUrl}</p>
              </div>
              <p className="text-[10px] text-slate-400 pt-2">This is an automated emergency alert from Suraksha Setu.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex flex-col gap-3">
            <Button 
              onClick={() => window.open(smsData?.trackingUrl || `/track/${caseData?.trackingToken || params.caseId}`, '_blank')}
              className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-bold rounded-full h-12 shadow-lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open Family Tracking Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSmsModal(false)}
              className="w-full rounded-full font-bold text-slate-600 h-10"
            >
              Close
            </Button>
          </div>

          {/* Security Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
            <Shield className="w-3 h-3" /> End-to-end encrypted • HIPAA compliant notification
          </div>
        </div>
      </div>
    )}

    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-start gap-4">
          <Link href="/ems/critical-cases" className="mt-1">
            <Button variant="outline" size="icon" className="rounded-full shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F284B] flex items-center gap-2">
              Case #{params.caseId.substring(0,8).toUpperCase()}
            </h1>
            <div className="text-sm font-medium mt-1 flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                caseData.severityLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                caseData.severityLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}>
                {caseData.severityLevel} SEVERITY
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                caseData.identityStatus === 'VERIFIED' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-orange-100 text-orange-800 border-orange-200'
              }`}>
                {caseData.identityStatus} IDENTITY
              </span>
              <span className="text-slate-500 px-2 py-0.5 rounded text-xs font-bold border border-slate-200 bg-slate-50">
                {caseData.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Link href={`/ems/vitals/${params.caseId}`} className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 rounded-full font-bold">
              <Activity className="w-4 h-4 mr-2" /> Vitals
            </Button>
          </Link>
          {isAssigned && (
            <>
              <VideoCallButton
                caseId={params.caseId}
                userRole="EMS"
                roomExists={!!caseData.hospitalResponses?.[0]?.videoRoomId}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold flex-1 md:flex-none"
              />
              <Link href={`/track/${caseData?.trackingToken || params.caseId}`} target="_blank" className="flex-1 md:flex-none">
                <Button className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold">
                  <Crosshair className="w-4 h-4 mr-2" /> Live Tracking
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F284B]">
                <User className="w-5 h-5 text-blue-600" /> Patient Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="col-span-2 flex items-center gap-4 border-b border-slate-100 pb-4 mb-2">
                  {p?.user?.profilePhoto ? (
                    <img src={p.user.profilePhoto} alt="Patient" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border-2 border-slate-200">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 font-bold mb-1">FULL NAME</div>
                    <div className="font-bold text-xl text-slate-900">
                      {caseData.identityStatus === "UNVERIFIED" && caseData.manualPatientName ? (
                        <span className="text-orange-600">{caseData.manualPatientName} (Unverified)</span>
                      ) : (
                        p?.user?.fullName || "Unknown"
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">AGE & GENDER</div>
                  <div className="font-bold text-lg text-slate-900">
                    {caseData.identityStatus === "UNVERIFIED" && caseData.manualPatientAge ? (
                      <span className="text-orange-600">~{caseData.manualPatientAge} Yrs, {caseData.manualPatientGender || "?"}</span>
                    ) : (
                      `${p?.age || "?"} Yrs, ${p?.gender || "?"}`
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">BLOOD GROUP</div>
                  <div className="font-bold text-xl text-red-600">{p?.bloodGroup || "?"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">VEHICLE INVOLVED</div>
                  <div className="font-bold text-lg text-slate-900">{caseData.vehicle?.vehicleNumber || "?"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-red-50 bg-red-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <HeartPulse className="w-5 h-5" /> Critical Medical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <div className="text-xs text-red-800/60 font-bold mb-1">KNOWN ALLERGIES</div>
                  <div className="font-bold text-red-800">{p?.medicalInfo?.allergies || "None declared"}</div>
                </div>
                <div>
                  <div className="text-xs text-red-800/60 font-bold mb-1">PREVIOUS CONDITIONS</div>
                  <div className="font-bold text-red-900">{p?.medicalInfo?.previousConditions || "None declared"}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-red-800/60 font-bold mb-1">CURRENT MEDICATIONS</div>
                  <div className="font-bold text-red-900">{p?.medicalInfo?.currentMedications || "None declared"}</div>
                </div>
                {p?.medicalInfo?.notes && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-red-800/60 font-bold mb-1">CRITICAL NOTES</div>
                    <div className="font-medium text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">{p.medicalInfo.notes}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F284B]">
                <Car className="w-5 h-5 text-indigo-600" /> Passengers Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {p?.passengers?.length > 0 ? (
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
                          {pass.bloodGroup && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{pass.bloodGroup}</span>
                          )}
                        </div>
                        <div className="mt-2 text-xs space-y-1">
                          {pass.healthConditions && <p className="truncate"><span className="font-bold text-slate-600">Conditions:</span> {pass.healthConditions}</p>}
                          {pass.allergies && <p className="truncate"><span className="font-bold text-slate-600">Allergies:</span> <span className="text-orange-600 font-medium">{pass.allergies}</span></p>}
                          {pass.emergencyContactName && (
                            <p className="truncate"><span className="font-bold text-slate-600">Contact:</span> {pass.emergencyContactName} ({pass.emergencyContactPhone})</p>
                          )}
                        </div>
                        <div className="mt-3">
                          <Link href={`/ems/vitals/${params.caseId}?passengerId=${pass.id}`}>
                            <Button size="sm" className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-bold text-xs">
                              Add Passenger Vitals
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No passengers registered.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Hospital Acceptance Alert Banner */}
          {statusAlert?.show && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-500">
              <div className={`p-5 rounded-2xl border-2 shadow-lg relative overflow-hidden ${
                statusAlert.status === 'ADMITTED' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' :
                statusAlert.status === 'CRITICAL' || statusAlert.status === 'DECLINED' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300' :
                'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
              }`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  statusAlert.status === 'ADMITTED' ? 'bg-green-500' :
                  statusAlert.status === 'CRITICAL' || statusAlert.status === 'DECLINED' ? 'bg-red-500 animate-pulse' :
                  'bg-blue-500'
                }`} />
                <button onClick={() => setStatusAlert(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    statusAlert.status === 'ADMITTED' ? 'bg-green-100' :
                    statusAlert.status === 'CRITICAL' || statusAlert.status === 'DECLINED' ? 'bg-red-100 animate-pulse' :
                    'bg-blue-100'
                  }`}>
                    {statusAlert.status === 'DECLINED' ? (
                      <AlertTriangle className="w-7 h-7 text-red-600" />
                    ) : (
                      <CheckCircle2 className={`w-7 h-7 ${
                        statusAlert.status === 'ADMITTED' ? 'text-green-600' :
                        statusAlert.status === 'CRITICAL' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-extrabold text-lg ${
                      statusAlert.status === 'ADMITTED' ? 'text-green-800' :
                      statusAlert.status === 'CRITICAL' || statusAlert.status === 'DECLINED' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {statusAlert.status === 'DECLINED' ? '⚠️' : '✅'} {statusAlert.hospitalName} — {statusMessages[statusAlert.status]?.label || statusAlert.status}
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-1">{statusAlert.details}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full border text-slate-500">🔔 Live Update</span>
                      <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className="border-indigo-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-indigo-50 border-b border-indigo-100">
              <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Hospital Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {isAssigned ? (
                <div className="space-y-4">
                  {/* Hospital Name + Current Status */}
                  <div className={`p-4 rounded-xl relative overflow-hidden border-2 transition-all duration-500 ${
                    (caseData.hospitalResponses[0]?.status === 'ADMITTED' || caseData.hospitalResponses[0]?.status === 'STABLE') 
                      ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
                      : caseData.hospitalResponses[0]?.status === 'CRITICAL'
                      ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50'
                      : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-[#0F284B] text-lg">{caseData.hospitalResponses[0]?.hospital?.hospitalName || "Assigned Hospital"}</div>
                        <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                          (caseData.hospitalResponses[0]?.status === 'ADMITTED' || caseData.hospitalResponses[0]?.status === 'STABLE') ? 'text-green-700' :
                          (caseData.hospitalResponses[0]?.status === 'CRITICAL' || caseData.hospitalResponses[0]?.status === 'DECLINED') ? 'text-red-700' : 'text-indigo-700'
                        }`}>
                          {caseData.hospitalResponses[0]?.status === 'DECLINED' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          {caseData.hospitalResponses[0]?.status || "NOTIFIED"}
                        </div>
                      </div>
                      {caseData.hospitalResponses[0]?.doctorAssigned && (
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-bold">DOCTOR ASSIGNED</div>
                          <div className="font-bold text-sm text-slate-800">{caseData.hospitalResponses[0].doctorAssigned}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Progression Timeline */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl">
                    <div className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> HOSPITAL RESPONSE TIMELINE
                    </div>
                    {(() => {
                      const currentStatus = caseData.hospitalResponses[0]?.status || "NOTIFIED";
                      const steps = [
                        { key: "NOTIFIED", label: "Hospital Notified", icon: Bell, desc: "Alert sent to ER" },
                        { key: "PREPARING", label: "Preparing", icon: ClipboardCheck, desc: "Team assembling" },
                        { key: "ADMITTED", label: "Patient Admitted", icon: BedDouble, desc: "Bed allocated" },
                        { key: "UNDER_TREATMENT", label: "Under Treatment", icon: Stethoscope, desc: "Active care" },
                      ];
                      const statusOrder = ["NOTIFIED", "PREPARING", "ADMITTED", "UNDER_TREATMENT", "STABLE", "CRITICAL"];
                      const currentIdx = statusOrder.indexOf(currentStatus);
                      const notifiedAt = caseData.hospitalResponses[0]?.createdAt;
                      
                      return (
                        <div className="flex items-start justify-between relative">
                          {/* Progress line */}
                          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 z-0" />
                          <div 
                            className="absolute top-5 left-6 h-0.5 bg-green-500 z-10 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (Math.max(0, currentIdx) / (steps.length - 1)) * 100)}%`, maxWidth: 'calc(100% - 48px)' }}
                          />
                          
                          {steps.map((step, i) => {
                            const stepIdx = statusOrder.indexOf(step.key);
                            const isComplete = currentIdx >= stepIdx;
                            const isCurrent = currentStatus === step.key;
                            const Icon = step.icon;
                            
                            return (
                              <div key={step.key} className="flex flex-col items-center relative z-20" style={{ width: '25%' }}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                  isCurrent ? 'border-green-500 bg-green-100 ring-4 ring-green-100 scale-110' :
                                  isComplete ? 'border-green-500 bg-green-500' :
                                  'border-slate-300 bg-white'
                                }`}>
                                  <Icon className={`w-4 h-4 ${
                                    isCurrent ? 'text-green-600' :
                                    isComplete ? 'text-white' :
                                    'text-slate-400'
                                  }`} />
                                </div>
                                <span className={`text-[10px] font-bold mt-2 text-center leading-tight ${
                                  isCurrent ? 'text-green-700' : isComplete ? 'text-green-600' : 'text-slate-400'
                                }`}>{step.label}</span>
                                {isCurrent && (
                                  <span className="text-[9px] text-green-600 font-medium mt-0.5 animate-pulse">● Live</span>
                                )}
                                {step.key === "NOTIFIED" && notifiedAt && (
                                  <span className="text-[9px] text-slate-400 font-medium mt-1">
                                    {new Date(notifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Tracking Link & Reassign Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl">
                      <h3 className="font-bold text-[#0F284B] flex items-center gap-2 mb-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" /> Tracking Link
                      </h3>
                      <div className="flex mt-3">
                        <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/track/${caseData?.trackingToken || params.caseId}`} className="text-xs bg-slate-50 border border-slate-200 p-2 rounded-l-md w-full outline-none" />
                        <Button size="sm" className="rounded-l-none bg-blue-600" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${caseData?.trackingToken || params.caseId}`)}>Copy</Button>
                      </div>
                    </div>

                    {(caseData.hospitalResponses[0]?.status === "NOTIFIED" || caseData.hospitalResponses[0]?.status === "PREPARING" || caseData.hospitalResponses[0]?.status === "DECLINED") && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-1 text-sm">
                            <AlertTriangle className="w-4 h-4 text-orange-600" /> Reassign Case
                          </h3>
                          <p className="text-[10px] text-orange-700 leading-tight">If the hospital is unresponsive or declined, reassign immediately.</p>
                        </div>
                        <Button 
                          onClick={cancelAssignment} 
                          disabled={cancelling}
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full bg-white border-orange-300 text-orange-700 hover:bg-orange-100 font-bold"
                        >
                          {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "🔄 Pick Different Hospital"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600 font-medium">Select a hospital to dispatch:</p>
                    <Link href={`/ems/nearby-hospitals?caseId=${params.caseId}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                        <MapPin className="w-3 h-3 mr-1" /> View Live Map
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {hospitals.length > 0 ? hospitals.map((h, i) => (
                    <div key={h.id} className="p-3 border rounded-xl bg-white hover:border-indigo-300 transition-colors cursor-pointer group flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-[#0F284B] text-sm group-hover:text-indigo-700">{h.hospitalName}</div>
                        {i === 0 && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">NEAREST</span>}
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between">
                        <span>{h.distanceKm} km away</span>
                        <span className="font-bold text-indigo-600">{h.etaMinutes} mins ETA</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => assignHospital(h.userId, h.etaMinutes)} 
                        disabled={assigning}
                        className="w-full mt-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        {assigning ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Assign & Notify"}
                      </Button>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-sm text-slate-500">No hospitals available nearby.</div>
                  )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
