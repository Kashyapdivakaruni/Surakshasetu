"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, ArrowRight, HeartPulse, Building2, Clock, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OpenCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/ems/critical-cases");
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases);
        }
      } catch (err) {
        console.error("Failed to fetch cases");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const handleCloseCase = async (caseId: string) => {
    setClosingId(caseId);
    try {
      const res = await fetch(`/api/ems/case/${caseId}/close`, { method: "PATCH" });
      if (res.ok) {
        setCases(cases.filter(c => c.id !== caseId));
      }
    } catch (err) {
      console.error("Failed to close case");
    } finally {
      setClosingId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading open cases...</div>;

  return (
    <div className="space-y-6 font-sans pb-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-600" /> Open Cases
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Monitor and manage ongoing live emergency operations.</p>
      </div>

      {cases.length === 0 ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="bg-green-50 p-6 rounded-full mb-4 border border-green-100">
            <HeartPulse className="w-12 h-12 text-green-500" />
          </div>
          <p className="font-bold text-xl text-[#0F284B]">No Open Cases Available</p>
          <p className="text-sm mt-2 text-slate-500 max-w-md">All units are standing by. Scan a QR code at an accident site to initiate a new case.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cases.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${getSeverityColor(c.severityLevel)}`}>
                            {c.severityLevel || "PENDING"} SEVERITY
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 uppercase">
                            {c.status.replace("_", " ")}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-[#0F284B]">
                          Patient: {c.identityStatus === "UNVERIFIED" && c.manualPatientName ? <span className="text-orange-600">{c.manualPatientName} (Unverified)</span> : (c.citizen?.user?.fullName || "Unknown")}
                        </h2>
                        <p className="text-sm font-mono text-slate-500 mt-1">Case #{c.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{c.accidentAddress || "Location pending"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span className="truncate">{c.assignedHospitalName || "Not Assigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span>ETA: {c.ambulanceEtaMinutes ? `${c.ambulanceEtaMinutes} mins` : "Unknown"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center gap-3 shrink-0 md:w-64">
                    <Button 
                      onClick={() => handleCloseCase(c.id)}
                      disabled={closingId === c.id}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-full h-11 shadow-md"
                    >
                      {closingId === c.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Close Case
                    </Button>
                    <Link href={`/ems/vitals/${c.id}`} className="w-full">
                      <Button variant="outline" className="w-full font-bold rounded-full h-11 border-slate-300 text-slate-700 hover:bg-slate-100">
                        Add Vitals
                      </Button>
                    </Link>
                    <Link href={`/track/${c.id}`} target="_blank" className="w-full text-center mt-1">
                      <span className="text-sm font-bold text-blue-600 hover:text-blue-800">Track Ambulance</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
