"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, HeartPulse, ShieldAlert, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CitizenMedical() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    allergies: "",
    previousConditions: "",
    currentMedications: "",
    disabilities: "",
    notes: ""
  });

  useEffect(() => {
    fetchMedicalInfo();
  }, []);

  const fetchMedicalInfo = async () => {
    try {
      const res = await fetch("/api/citizen/profile");
      const data = await res.json();
      if (res.ok) {
        setFormData({
          allergies: data.medicalInfo?.allergies || "",
          previousConditions: data.medicalInfo?.previousConditions || "",
          currentMedications: data.medicalInfo?.currentMedications || "",
          disabilities: data.medicalInfo?.disabilities || "",
          notes: data.medicalInfo?.notes || ""
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load medical info", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/citizen/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalInfo: formData })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Success", description: "Medical information updated securely", type: "success" });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading medical profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">Medical Info</h1>
          <p className="text-slate-500 mt-1 font-medium">Critical health details for first responders.</p>
        </div>
        <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-md px-6 h-11 shrink-0 transition-all hover:-translate-y-0.5">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="bg-red-50/50 border border-red-100 text-red-800 rounded-2xl p-5 flex items-start gap-4 mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8 shrink-0 text-red-500 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-900">Privacy Protected</h3>
          <p className="text-sm mt-1 font-medium text-red-700/80 leading-relaxed">
            This information is strictly confidential. It is linked to your secure QR code but can only be read by authorized EMS and Hospital personnel in the event of an emergency. Police cannot view full medical details.
          </p>
        </div>
      </div>

      <Card className="border border-red-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-red-50/30 border-b border-red-50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-red-800">
            <HeartPulse className="w-5 h-5 text-red-500" /> Health Profile
          </CardTitle>
          <CardDescription className="text-red-600/70 font-medium">Keep this updated. It could save your life.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 bg-white">
          <div className="space-y-2">
            <Label className="text-[#0F284B] font-semibold">Known Allergies</Label>
            <textarea 
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm text-red-600 font-semibold focus:border-red-500 focus:ring-red-500 outline-none"
              placeholder="E.g., Penicillin, Peanuts, Latex"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#0F284B] font-semibold">Existing Medical Conditions</Label>
            <textarea 
              name="previousConditions"
              value={formData.previousConditions}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm focus:border-orange-500 outline-none"
              placeholder="E.g., Diabetes, Hypertension, Asthma"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0F284B] font-semibold">Current Medications</Label>
            <textarea 
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm focus:border-orange-500 outline-none"
              placeholder="List any medications you take regularly"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0F284B] font-semibold">Disabilities or Special Needs</Label>
            <textarea 
              name="disabilities"
              value={formData.disabilities}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm focus:border-orange-500 outline-none"
              placeholder="Any physical or cognitive disabilities"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0F284B] font-semibold">Additional Emergency Notes</Label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm focus:border-orange-500 outline-none"
              placeholder="Anything else EMS should know (e.g. May require oxygen support during breathing difficulty)"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
