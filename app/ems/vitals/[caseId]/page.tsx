"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Camera, X, UploadCloud, CheckCircle2, ArrowLeft, Brain, AlertTriangle, Shield, ArrowRight } from "lucide-react";
import { computeTriageScore, type TriageResult } from "@/lib/aiTriage";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AddVitalsPage({ params }: { params: { caseId: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const initPassengerId = searchParams.get("passengerId") || "PRIMARY";

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>(initPassengerId);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [showTriage, setShowTriage] = useState(false);
  
  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/ems/case/${params.caseId}`);
        if (res.ok) {
          const data = await res.json();
          // Extract unique patients from initial EMSVitals
          const vitals = data.emergencyCase.emsVitals || [];
          const uniquePatientsMap = new Map();
          vitals.forEach((v: any) => {
            if (!uniquePatientsMap.has(v.passengerId)) {
              let pName = v.patientName;
              if (!pName || pName === "Unknown Passenger" || pName === "Unknown Patient") {
                if (v.passengerId === "PRIMARY") {
                  pName = data.emergencyCase.citizen?.user?.fullName || data.emergencyCase.manualPatientName || "Primary Patient";
                } else {
                  const passObj = data.emergencyCase.citizen?.passengers?.find((p: any) => p.id === v.passengerId);
                  pName = passObj?.name || "Unknown Passenger";
                }
              }
              uniquePatientsMap.set(v.passengerId, {
                passengerId: v.passengerId,
                patientName: pName
              });
            }
          });
          setPatients(Array.from(uniquePatientsMap.values()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCase();
  }, [params.caseId]);
  const [formData, setFormData] = useState({
    bloodPressure: "",
    pulseRate: "",
    oxygenLevel: "",
    temperature: "",
    respiratoryRate: "",
    bloodSugar: "",
    bleedingSeverity: "LOW",
    fractureDetails: "",
    consciousnessStatus: "CONSCIOUS",
    injuryObservations: "",
    emergencyNotes: ""
  });

  const [images, setImages] = useState<{ dataUrl: string, fileName: string }[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max size is 5MB", type: "error" });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, { dataUrl: event.target!.result as string, fileName: file.name }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/ems/case/${params.caseId}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          passengerId: selectedPassengerId,
          patientName: patients.find(p => p.passengerId === selectedPassengerId)?.patientName,
          images
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Compute local triage for immediate display
        const localTriage = computeTriageScore({
          bloodPressure: formData.bloodPressure,
          pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : null,
          oxygenLevel: formData.oxygenLevel ? parseInt(formData.oxygenLevel) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
          consciousnessStatus: formData.consciousnessStatus,
          bleedingSeverity: formData.bleedingSeverity,
          bloodSugar: formData.bloodSugar ? parseInt(formData.bloodSugar) : null
        });
        setTriageResult(localTriage);
        setShowTriage(true);
        toast({ title: "Vitals Logged + AI Triage Complete", description: `Triage Level: ${localTriage.label} (Score: ${localTriage.score}/${localTriage.maxScore})`, type: "success" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save vitals");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (showTriage && triageResult) {
    return (
      <div className="max-w-4xl mx-auto font-sans pb-10 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" /> AI Triage Assessment
            </h1>
            <p className="text-slate-500 font-medium">AI-assisted severity analysis using Enhanced NEWS2 scoring</p>
          </div>
        </div>

        {/* Main Triage Score Card */}
        <Card className={`${triageResult.borderColor} ${triageResult.bgColor} shadow-lg rounded-2xl overflow-hidden border-2`}>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full border-4 ${triageResult.borderColor} flex flex-col items-center justify-center ${triageResult.bgColor}`}>
                  <div className={`text-4xl font-black ${triageResult.color}`}>{triageResult.score}</div>
                  <div className="text-xs text-slate-500 font-bold">/ {triageResult.maxScore}</div>
                </div>
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-extrabold text-white ${
                  triageResult.level === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 
                  triageResult.level === 'HIGH' ? 'bg-orange-500' : 
                  triageResult.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'
                }`}>
                  {triageResult.label}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className={`text-2xl font-extrabold ${triageResult.color} mb-2`}>
                  {triageResult.level === 'CRITICAL' ? '🔴' : triageResult.level === 'HIGH' ? '🟠' : triageResult.level === 'MEDIUM' ? '🟡' : '🟢'} {triageResult.label} — Triage Level {triageResult.level === 'CRITICAL' ? '1' : triageResult.level === 'HIGH' ? '2' : triageResult.level === 'MEDIUM' ? '3' : '4'}
                </h2>
                <p className="text-slate-600 font-medium mb-3">{triageResult.recommendation}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-purple-700">Confidence Score: {triageResult.confidence}%</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 font-medium">Clinical Model: Enhanced NEWS2 Framework</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Alerts */}
        {triageResult.alerts.length > 0 && (
          <Card className="border-red-200 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-100 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" /> AI Clinical Alerts ({triageResult.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {triageResult.alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-xl border-l-4 ${
                  alert.type === 'CRITICAL' ? 'border-l-red-600 bg-red-50' : 'border-l-amber-500 bg-amber-50'
                }`}>
                  <div className={`font-extrabold text-sm flex items-center gap-2 ${
                    alert.type === 'CRITICAL' ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {alert.type === 'CRITICAL' ? '🚨' : '⚠️'} {alert.title}
                  </div>
                  <p className={`text-sm mt-1 font-medium ${
                    alert.type === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'
                  }`}>{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => router.push(`/ems/nearby-hospitals?caseId=${params.caseId}`)}
            className="flex-1 bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-extrabold text-lg h-14 rounded-full shadow-lg"
          >
            Proceed to AI Hospital Selection <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { setShowTriage(false); setTriageResult(null); }}
            className="font-bold rounded-full h-14 text-slate-600"
          >
            Record More Vitals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-10 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/ems/case/${params.caseId}`}>
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-2">
            <Activity className="w-8 h-8 text-red-500" /> Record Vitals
          </h1>
          <p className="text-slate-500 font-medium">Update real-time patient status for hospital prep.</p>
        </div>
      </div>

      {patients.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {patients.map(p => (
            <Button 
              key={p.passengerId}
              variant={selectedPassengerId === p.passengerId ? "default" : "outline"}
              onClick={() => setSelectedPassengerId(p.passengerId)}
              className={`rounded-full whitespace-nowrap font-bold ${selectedPassengerId === p.passengerId ? 'bg-[#0F284B] text-white' : 'text-slate-600 bg-white'}`}
            >
              {p.patientName}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-[#0F284B]">Manual Vitals - {patients.find(p => p.passengerId === selectedPassengerId)?.patientName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Blood Pressure (mmHg)</Label>
              <Input 
                placeholder="120/80" 
                value={formData.bloodPressure}
                onChange={e => setFormData({...formData, bloodPressure: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Pulse Rate (bpm)</Label>
              <Input 
                type="number" 
                placeholder="75" 
                value={formData.pulseRate}
                onChange={e => setFormData({...formData, pulseRate: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>SpO2 (%)</Label>
              <Input 
                type="number" 
                placeholder="98" 
                value={formData.oxygenLevel}
                onChange={e => setFormData({...formData, oxygenLevel: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature (°F)</Label>
              <Input 
                type="number" 
                placeholder="98.6" 
                step="0.1"
                value={formData.temperature}
                onChange={e => setFormData({...formData, temperature: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Respiratory Rate (bpm)</Label>
              <Input 
                type="number" 
                placeholder="16" 
                value={formData.respiratoryRate}
                onChange={e => setFormData({...formData, respiratoryRate: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Blood Sugar (mg/dL)</Label>
              <Input 
                type="number" 
                placeholder="100" 
                value={formData.bloodSugar}
                onChange={e => setFormData({...formData, bloodSugar: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Bleeding Severity</Label>
              <select 
                value={formData.bleedingSeverity}
                onChange={e => setFormData({...formData, bleedingSeverity: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="NONE">None</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical / Massive Hemorrhage</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Consciousness Status</Label>
              <select 
                value={formData.consciousnessStatus}
                onChange={e => setFormData({...formData, consciousnessStatus: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="CONSCIOUS">Conscious</option>
                <option value="SEMI_CONSCIOUS">Semi-Conscious</option>
                <option value="UNCONSCIOUS">Unconscious</option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Fracture Details</Label>
              <Input 
                placeholder="Describe any visible or suspected fractures..." 
                value={formData.fractureDetails}
                onChange={e => setFormData({...formData, fractureDetails: e.target.value})}
                className="bg-slate-50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-[#0F284B]">Medical Device Uploads</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-4">Attach photos of ECG, BP Monitors, or injury observations. Max 5MB per image.</p>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 group">
                  <Image src={img.dataUrl} alt={`Upload ${i}`} layout="fill" objectFit="cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500">Add Image</span>
                <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" multiple onChange={handleImageUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-[#0F284B]">Observations</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Visible Injuries</Label>
              <textarea 
                placeholder="Describe visible injuries..."
                value={formData.injuryObservations}
                onChange={e => setFormData({...formData, injuryObservations: e.target.value})}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Notes</Label>
              <textarea 
                placeholder="Any other critical info for hospital prep..."
                value={formData.emergencyNotes}
                onChange={e => setFormData({...formData, emergencyNotes: e.target.value})}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-extrabold text-lg h-14 rounded-full shadow-lg transition-transform hover:-translate-y-0.5">
          {loading ? "Saving..." : <><CheckCircle2 className="w-6 h-6 mr-2" /> Submit Vitals</>}
        </Button>
      </form>
    </div>
  );
}
