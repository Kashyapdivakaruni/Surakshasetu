"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Navigation, Clock, Activity, CheckCircle2, Phone, AlertCircle, Brain, Shield } from "lucide-react";
import { EMSNearbyHospitalMap } from "@/components/maps/EMSNearbyHospitalMap";
import { motion } from "framer-motion";

import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function NearbyHospitalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const caseId = searchParams.get("caseId");

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [location, setLocation] = useState({ lat: 17.3850, lng: 78.4867 });
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch("/api/ems/hospitals?lat=17.3850&lng=78.4867");
        if (res.ok) {
          const data = await res.json();
          setHospitals(data.hospitals);
          setLocation(data.location);
        } else {
          toast({ title: "Error", description: "Failed to fetch hospitals", type: "error" });
        }
      } catch (err) {
        console.error("Failed to fetch hospitals", err);
        toast({ title: "Error", description: "Failed to fetch hospitals", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, []);

  const assignHospital = async (hospitalId: string, etaMinutes: number) => {
    if (!caseId) {
      toast({ title: "No active case", description: "You are viewing this map in standalone mode.", type: "error" });
      return;
    }
    
    setAssigning(hospitalId);
    try {
      const res = await fetch(`/api/ems/case/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, ambulanceEtaMinutes: etaMinutes })
      });
      if (res.ok) {
        toast({ title: "Hospital Assigned", description: "Emergency case sent to hospital successfully.", type: "success" });
        router.push(`/ems/case/${caseId}`);
      } else {
        throw new Error("Failed to assign hospital");
      }
    } catch (err) {
      toast({ title: "Assignment Failed", description: "Could not sync with hospital.", type: "error" });
      setAssigning(null);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Locating nearby facilities...</div>;

  return (
    <div className="space-y-6 font-sans pb-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-3">
          <Building2 className="w-8 h-8 text-indigo-600" /> Nearby Hospitals
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Find the nearest trauma centers and emergency rooms.</p>
      </div>

      <Card className="rounded-2xl overflow-hidden border-slate-200 shadow-sm p-2 bg-white">
        <EMSNearbyHospitalMap 
          accidentLocation={location} 
          hospitals={hospitals} 
          onHospitalSelect={(id: string, etaMinutes: number) => assignHospital(id, etaMinutes)}
        />
      </Card>

      <div className="grid gap-4 mt-6">
        {hospitals.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`border ${i === 0 ? 'border-indigo-300 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm'} rounded-2xl overflow-hidden relative`}>
              {i === 0 && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl flex items-center gap-1.5 shadow-lg">
                  <Brain className="w-3.5 h-3.5" /> AI-OPTIMIZED RECOMMENDATION
                </div>
              )}
              <CardContent className="p-0 flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-[#0F284B]">{h.hospitalName}</h2>
                    {h.status === "Available" ? (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded border border-green-200">AVAILABLE</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded border border-orange-200">{h.status}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-1">{h.address}</p>
                  <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-1">✉️ {h.email}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 font-bold mb-1 flex items-center"><Navigation className="w-3 h-3 mr-1 text-blue-500"/> DISTANCE</div>
                      <div className="font-bold text-[#0F284B]">{h.distanceKm} km</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 font-bold mb-1 flex items-center"><Clock className="w-3 h-3 mr-1 text-orange-500"/> ETA</div>
                      <div className="font-bold text-[#0F284B]">{h.etaMinutes} mins</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 font-bold mb-1 flex items-center"><Activity className="w-3 h-3 mr-1 text-red-500"/> ICU BEDS</div>
                      <div className={`font-bold ${h.icuBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.icuBedsAvailable} Available
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-500 font-bold mb-1 flex items-center"><Building2 className="w-3 h-3 mr-1 text-indigo-500"/> WARD BEDS</div>
                      <div className={`font-bold ${h.emergencyBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.emergencyBedsAvailable} Available
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    {h.traumaCareAvailable && <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">Trauma Center</span>}
                    {h.emergencySupportAvailable && <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">24/7 ER Support</span>}
                    {h.specialization && <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">{h.specialization}</span>}
                    <span className="ml-auto flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      <Shield className="w-3 h-3" /> AI Score: {h.aiScore}/100
                    </span>
                  </div>

                  {/* AI Score Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>AI COMPATIBILITY SCORE</span>
                      <span className={h.aiScore >= 70 ? 'text-green-600' : h.aiScore >= 40 ? 'text-amber-600' : 'text-red-600'}>{h.aiScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${h.aiScore >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' : h.aiScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                        style={{ width: `${h.aiScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-center gap-3 md:w-56 shrink-0">
                  <Button 
                    disabled={assigning !== null}
                    onClick={() => assignHospital(h.userId, h.etaMinutes)} // userId maps to hospitalId in schema
                    className={`w-full font-bold rounded-full h-11 shadow-md ${i === 0 ? 'bg-[#0F284B] hover:bg-[#1A3A6B] text-white' : 'bg-white text-[#0F284B] border border-slate-300 hover:bg-slate-100'}`}
                  >
                    {assigning === h.userId ? "Assigning..." : "Select Hospital"}
                  </Button>
                  <Button variant="outline" className="w-full font-bold rounded-full h-11 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    <Navigation className="w-4 h-4 mr-2" /> Route
                  </Button>
                  <div className="text-center mt-2 flex items-center justify-center text-xs text-slate-500 font-bold">
                    <Phone className="w-3 h-3 mr-1" /> {h.contactNumber}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
