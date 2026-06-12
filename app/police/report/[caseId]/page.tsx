"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ShieldCheck, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function PoliceReportPage({ params }: { params: { caseId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [firNumber, setFirNumber] = useState(`REF-${params.caseId.toUpperCase()}`);
  const [incidentDetails, setIncidentDetails] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState("VERIFIED");
  const [location, setLocation] = useState("Western Express Highway, Mumbai");
  const [legalNotes, setLegalNotes] = useState("");
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [vehicleDamage, setVehicleDamage] = useState("");
  const [injurySeverity, setInjurySeverity] = useState("MEDIUM");
  const [witnessInfo, setWitnessInfo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch(`/api/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId: params.caseId, fileType: type, fileName: file.name, dataUrl: base64 })
        });
        if (res.ok) toast({ title: "Evidence Uploaded", description: "File attached to case report.", type: "success" });
        else throw new Error();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ title: "Error", description: "Could not upload file", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Optionally fetch existing report here
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/police/report/${params.caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firNumber,
          accidentDescription: `Date & Time: ${dateTime.replace("T", " ")}\nInjury Severity: ${injurySeverity}\nVehicle Damage: ${vehicleDamage}\nWitnesses: ${witnessInfo}\n\nDescription:\n${incidentDetails}`,
          vehicleVerificationStatus: vehicleStatus,
          accidentLocation: location,
          legalNotes
        })
      });
      if (res.ok) {
        setSaved(true);
        toast({ title: "Report Filed", description: "FIR generated successfully. You can now download the PDF.", type: "success" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to file report", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/police/case/${params.caseId}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Accident Report</h1>
          <p className="text-muted-foreground mt-1">File official reference / FIR for Case #{params.caseId}</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-slate-800">
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>FIR / Reference Number</Label>
              <Input placeholder="e.g. FIR-2026-0012" value={firNumber} onChange={(e) => setFirNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Location of Incident</Label>
              <Input placeholder="e.g. Western Express Highway" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Injury Severity</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={injurySeverity}
                onChange={e => setInjurySeverity(e.target.value)}
              >
                <option value="LOW">Low - Minor Scratches</option>
                <option value="MEDIUM">Medium - Non-Life Threatening</option>
                <option value="HIGH">High - Severe Injuries</option>
                <option value="CRITICAL">Critical - Life Threatening / Fatal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Verification Status</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold text-green-700 bg-green-50"
                value={vehicleStatus}
                onChange={e => setVehicleStatus(e.target.value)}
              >
                <option value="VERIFIED">Verified - Details Match Registration</option>
                <option value="UNVERIFIED">Unverified / Pending check</option>
                <option value="DISPUTED">Disputed - Details Mismatch</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Vehicle Damage Details</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe damages to involved vehicles..."
                value={vehicleDamage}
                onChange={(e) => setVehicleDamage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Witness Information</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Names and contact details of witnesses..."
                value={witnessInfo}
                onChange={(e) => setWitnessInfo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accident Description</Label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe the scene and sequence of events..."
              value={incidentDetails}
              onChange={(e) => setIncidentDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence Uploads</Label>
            <div className="flex gap-4">
              <div className="flex-1 relative border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, "REPORT_EVIDENCE")} disabled={uploading} />
                <div className="text-sm font-bold text-slate-700">{uploading ? "Uploading..." : "Upload Photos / Documents"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Legal Actions / Police Notes</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Any immediate legal actions taken or pending..."
              value={legalNotes}
              onChange={e => setLegalNotes(e.target.value)}
            />
          </div>

          {saved ? (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-bold" 
                disabled
              >
                Report Filed Successfully!
              </Button>
              <Button 
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-lg font-bold" 
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" /> Download FIR PDF
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-lg" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Filing..." : <><Save className="w-4 h-4 mr-2" /> File Official Report</>}
            </Button>
          )}
          {saved && (
            <p className="text-green-600 text-sm text-center flex justify-center items-center font-bold">
              <ShieldCheck className="w-4 h-4 mr-1" /> Logged to Audit Trail
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
