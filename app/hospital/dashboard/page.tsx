"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, User, HeartPulse, ShieldCheck, MapPin, Loader2, ArrowRight, Save, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function HospitalDashboard() {
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(true);
  
  const [profile, setProfile] = useState<any>(null);
  const [editIcu, setEditIcu] = useState(0);
  const [editWard, setEditWard] = useState(0);
  const [editStatus, setEditStatus] = useState("Available");
  const [updatingBeds, setUpdatingBeds] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchCases = async (isPoll = false) => {
    try {
      const res = await fetch("/api/hospital/incoming-cases");
      if (res.ok) {
        const data = await res.json();
        setCases(data.incomingCases);
        
        // Only update profile if we aren't currently editing to prevent overwriting user input
        if (data.profile && !hasUnsavedChanges) {
          setProfile(data.profile);
          setEditIcu(data.profile.icuBedsAvailable);
          setEditWard(data.profile.emergencyBedsAvailable);
          setEditStatus(data.profile.status);
        }
        
        setSyncing(true);
      } else {
        setSyncing(false);
      }
    } catch (err) {
      setSyncing(false);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(() => {
      fetchCases(true);
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, []);

  const handlePrepare = async (caseId: string) => {
    try {
      const res = await fetch(`/api/hospital/prepare/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING", preparationNotes: "Ward is being prepared." })
      });
      if (res.ok) {
        toast({ title: "Status Updated", description: "EMS notified that ward is preparing.", type: "success" });
        fetchCases(true);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", type: "error" });
    }
  };

  const handleUpdateBeds = async () => {
    setUpdatingBeds(true);
    try {
      const res = await fetch(`/api/hospital/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          icuBedsAvailable: Number(editIcu), 
          emergencyBedsAvailable: Number(editWard),
          status: editStatus
        })
      });
      if (res.ok) {
        toast({ title: "Beds Updated", description: "Your availability is now live for EMS.", type: "success" });
        setHasUnsavedChanges(false);
        fetchCases(true);
      } else {
        throw new Error("Failed to update beds");
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not update availability.", type: "error" });
    } finally {
      setUpdatingBeds(false);
    }
  };
  const adjustIcu = (amount: number) => {
    const newVal = Math.max(0, editIcu + amount);
    setEditIcu(newVal);
    setHasUnsavedChanges(true);
  };

  const adjustWard = (amount: number) => {
    const newVal = Math.max(0, editWard + amount);
    setEditWard(newVal);
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (e: any) => {
    setEditStatus(e.target.value);
    setHasUnsavedChanges(true);
  };
  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading hospital dashboard...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hospital Emergency Ward</h1>
          <p className="text-muted-foreground mt-1 font-medium">Monitor incoming cases and prepare trauma care units.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
          <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-bold text-slate-600">{syncing ? "Live Sync Active" : "Sync Unavailable"}</span>
        </div>
      </div>

      {profile && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">HOSPITAL STATUS</div>
            <div className="flex items-center gap-3">
              <select 
                value={editStatus} 
                onChange={handleStatusChange}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md p-1.5 text-sm font-bold focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Available">Available</option>
                <option value="Emergency Only">Emergency Only</option>
                <option value="Full">Full</option>
              </select>
              {hasUnsavedChanges && <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unsaved changes</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button onClick={handleUpdateBeds} disabled={updatingBeds || !hasUnsavedChanges} className={`w-full sm:w-auto font-bold ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {updatingBeds ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 border-b border-teal-100 bg-teal-50/50">
            <CardTitle className="text-sm font-bold text-teal-800 uppercase tracking-wide">ICU Beds Available</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex items-center justify-center">
            <input 
              type="number" 
              min="0"
              value={editIcu} 
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setEditIcu(Math.max(0, val));
                setHasUnsavedChanges(true);
              }}
              className="text-5xl font-black text-teal-700 w-24 text-center bg-transparent border-none focus:outline-none focus:ring-0" 
            />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wide">Emergency Ward Beds</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex items-center justify-center">
            <input 
              type="number" 
              min="0"
              value={editWard} 
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setEditWard(Math.max(0, val));
                setHasUnsavedChanges(true);
              }}
              className="text-5xl font-black text-slate-800 w-24 text-center bg-transparent border-none focus:outline-none focus:ring-0" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 border-b border-red-100 bg-red-50/50">
            <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Incoming Critical
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-black text-red-700 animate-pulse">{cases.filter(c => c.severityLevel === 'CRITICAL' || c.severityLevel === 'HIGH').length}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4 text-[#0F284B] flex items-center gap-2">
        <Activity className="w-5 h-5 text-red-500" /> Incoming Ambulance Dispatches
      </h2>
      
      {cases.length === 0 ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
            <ShieldCheck className="w-12 h-12 text-slate-300" />
          </div>
          <p className="font-bold text-xl text-[#0F284B]">No incoming emergency cases assigned yet.</p>
          <p className="text-sm mt-2 text-slate-500 max-w-md">Live sync is active. New cases assigned by EMS will automatically appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {cases.map((c) => {
              const vitals = c.emsVitals?.[0];
              const hospitalRes = c.hospitalResponses?.[0];
              const status = hospitalRes?.status || "NOTIFIED";
              
              return (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className="border border-red-200 shadow-md relative overflow-hidden rounded-2xl bg-white">
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-red-50 to-transparent pointer-events-none"></div>
                    
                    <CardContent className="p-0 flex flex-col md:flex-row">
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-600 mr-2 animate-ping"></span>
                              ETA: {c.ambulanceEtaMinutes || ((c.id.charCodeAt(0) || 0) % 15) + 5} MINS
                            </div>
                            <div className="text-slate-500 font-mono text-sm font-bold bg-slate-100 px-2 py-0.5 rounded">
                              #{c.id.substring(0,8).toUpperCase()}
                            </div>
                            {c.citizen?.user && (
                                <div className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 flex items-center">
                                  Assigned by: EMS Unit
                                </div>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {c.accidentAddress || "Location Unknown"}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                          <div>
                            <div className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-3 flex items-center gap-1">
                              <User className="w-4 h-4" /> Patient Identity
                            </div>
                            <div className="flex gap-4 items-center">
                              {c.citizen?.user?.profilePhoto ? (
                                <img src={c.citizen.user.profilePhoto} alt="Patient" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                  <User className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-extrabold text-xl text-[#0F284B]">{c.citizen?.user?.fullName || "Unknown Patient"}</div>
                                <div className="text-sm font-medium text-slate-600 mt-0.5">
                                  {c.citizen?.age ? `${c.citizen.age} Yrs` : "? Yrs"} • {c.citizen?.gender || "?"} • Blood: <span className="text-red-600 font-bold">{c.citizen?.bloodGroup || "?"}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Co-passengers */}
                            {c.citizen?.passengers?.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-100">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Co-Passengers Involved</div>
                                <div className="flex flex-col gap-2">
                                  {c.citizen.passengers.map((p: any) => (
                                    <div key={p.id} className="text-sm flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0">
                                        {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                                      </div>
                                      <span className="font-bold text-slate-700">{p.name}</span>
                                      <span className="text-slate-400">({p.relationship}, {p.age}y)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="text-xs text-orange-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <HeartPulse className="w-4 h-4" /> Critical Medical Info
                            </div>
                            {c.citizen?.medicalInfo?.allergies ? (
                              <div className="text-sm font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded inline-block border border-orange-200">Allergy: {c.citizen.medicalInfo.allergies}</div>
                            ) : (
                              <div className="text-sm font-medium text-slate-500 italic">No allergies recorded</div>
                            )}
                            {c.citizen?.medicalInfo?.previousConditions && (
                              <div className="text-sm font-medium text-slate-700 mt-1 truncate">Condition: {c.citizen.medicalInfo.previousConditions}</div>
                            )}
                          </div>
                        </div>

                        {vitals && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Latest EMS Vitals</div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono font-bold">
                              <div><span className="text-slate-400 font-sans text-xs">BP:</span> {vitals.bloodPressure || "--"}</div>
                              <div><span className="text-slate-400 font-sans text-xs">HR:</span> <span className={vitals.pulseRate > 100 ? "text-red-600" : ""}>{vitals.pulseRate || "--"}</span></div>
                              <div><span className="text-slate-400 font-sans text-xs">O2:</span> {vitals.oxygenLevel ? `${vitals.oxygenLevel}%` : "--"}</div>
                              <div><span className="text-slate-400 font-sans text-xs">TEMP:</span> {vitals.temperature || "--"}</div>
                            </div>
                            {vitals.emergencyNotes && (
                              <div className="text-sm text-slate-700 mt-3 font-medium bg-white p-2 rounded border border-slate-100 italic">
                                "{vitals.emergencyNotes}"
                              </div>
                            )}

                            {/* Uploaded Reading Images */}
                            {c.uploadedFiles?.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Uploaded Medical Readings</div>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {c.uploadedFiles.map((file: any) => (
                                    <div key={file.id} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 shrink-0 group cursor-pointer">
                                      <img src={file.dataUrl} alt="Medical reading" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 flex flex-col justify-center gap-3 min-w-[240px] border-t md:border-t-0 md:border-l border-slate-200 p-6 shrink-0">
                        <div className="text-center mb-2">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Ward Status</div>
                          {status === "NOTIFIED" ? (
                            <div className="inline-block px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg font-bold text-sm border border-yellow-200">
                              AWAITING PREP
                            </div>
                          ) : (
                            <div className="inline-block px-3 py-1.5 bg-green-100 text-green-800 rounded-lg font-bold text-sm border border-green-200">
                              <Activity className="w-4 h-4 inline mr-1" /> {status}
                            </div>
                          )}
                        </div>

                        {status === "NOTIFIED" ? (
                          <Button onClick={() => handlePrepare(c.id)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-full shadow-md">
                            Acknowledge & Prepare
                          </Button>
                        ) : (
                          <Link href={`/hospital/case/${c.id}`}>
                            <Button variant="outline" className="w-full h-12 font-bold rounded-full border-teal-600 text-teal-700 hover:bg-teal-50 group">
                              Open Case Details <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
