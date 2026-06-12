"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, User, ShieldAlert, FileText, CheckCircle2, XCircle, Camera, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function PoliceCasePage({ params }: { params: { caseId: string } }) {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/police/report/${params.caseId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.caseId]);

  const verifyIdentity = async (verified: boolean) => {
    try {
      const res = await fetch(`/api/police/report/${params.caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityVerified: verified })
      });
      if (res.ok) {
        toast({ title: "Identity Updated", description: verified ? "Match Confirmed" : "Match Rejected", type: "success" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not verify", type: "error" });
    }
  };

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
          body: JSON.stringify({
            caseId: params.caseId,
            fileType: type,
            fileName: file.name,
            dataUrl: base64
          })
        });
        
        if (res.ok) {
          toast({ title: "Evidence Uploaded", description: "File saved to case record", type: "success" });
        } else {
          toast({ title: "Upload Failed", description: "Could not save file", type: "error" });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ title: "Error", description: "Could not upload file", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const closeCase = async () => {
    try {
      const res = await fetch(`/api/police/report/${params.caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closeCase: true })
      });
      if (res.ok) {
        toast({ title: "Case Closed", description: "Accident case has been closed.", type: "success" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not close case", type: "error" });
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading verified case records...</div>;
  if (!data || !data.emergencyCase) return <div className="p-10 text-center font-bold text-slate-500">Case not found</div>;

  const { emergencyCase, report } = data;
  const p = emergencyCase.citizen;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/police/dashboard">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accident Case #{params.caseId.substring(0,8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">Review verified vehicle and owner data.</p>
        </div>
        <div className="ml-auto flex gap-2">
          {emergencyCase.status !== "CLOSED" && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 font-bold" onClick={closeCase}>
              Close Case
            </Button>
          )}
          <Link href={`/police/report/${params.caseId}`}>
            <Button className="bg-slate-800 hover:bg-slate-900">
              <FileText className="w-4 h-4 mr-2" /> {report?.firNumber ? "View Official Report" : "Create Official Report"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Medical Privacy Filter Active</h3>
          <p className="text-sm mt-1">
            As per protocol, sensitive medical history, allergies, and EMS vitals are hidden. This view only provides data relevant for law enforcement and legal reporting.
          </p>
        </div>
      </div>

      <Card className="border-t-4 border-t-indigo-600 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {p?.user?.profilePhoto ? (
              <img src={p.user.profilePhoto} alt="Primary Citizen" className="w-32 h-32 rounded-lg object-cover shadow-md border" />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <User className="w-10 h-10 mb-2" />
                <span className="text-xs font-bold">No Photo</span>
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-black text-slate-900">{p?.user?.fullName || "Unknown"}</h3>
              <p className="text-slate-500 font-medium">Age: {p?.age || "?"} | Gender: {p?.gender || "?"}</p>
              
              <div className="mt-4 p-4 bg-slate-50 border rounded-lg">
                <p className="font-bold text-slate-800 mb-3 text-sm">Does the accident victim match the QR-linked identity?</p>
                <div className="flex gap-3 justify-center sm:justify-start">
                  <Button 
                    onClick={() => verifyIdentity(true)} 
                    variant={emergencyCase.identityStatus === "VERIFIED" ? "default" : "outline"}
                    className={emergencyCase.identityStatus === "VERIFIED" ? "bg-green-600 hover:bg-green-700 font-bold" : "border-green-200 text-green-700 font-bold"}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Match Confirmed
                  </Button>
                  <Button 
                    onClick={() => verifyIdentity(false)} 
                    variant={emergencyCase.identityStatus === "REJECTED" ? "destructive" : "outline"}
                    className={emergencyCase.identityStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700 font-bold" : "border-red-200 text-red-700 font-bold"}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Match Rejected
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {p?.passengers?.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-bold text-slate-800 mb-3 text-sm">Co-Passengers</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {p.passengers.map((pass: any) => (
                  <div key={pass.id} className="border rounded-lg p-3 text-center bg-white shadow-sm">
                    {pass.photo ? (
                      <img src={pass.photo} alt={pass.name} className="w-16 h-16 rounded-full mx-auto object-cover mb-2 border shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-2 text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <div className="font-bold text-slate-800 text-sm truncate">{pass.name}</div>
                    <div className="text-xs text-slate-500">{pass.relationship}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b bg-slate-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="w-5 h-5 text-slate-600" /> Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="text-sm text-slate-500">Registration Number</div>
              <div className="font-bold text-2xl text-slate-800">{emergencyCase.vehicle?.vehicleNumber || "Unknown"}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500">Make / Model</div>
                <div className="font-bold">{emergencyCase.vehicle?.makeModel || "Unknown"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Color</div>
                <div className="font-bold">{emergencyCase.vehicle?.color || "Unknown"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b bg-slate-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-600" /> Evidence Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, "ACCIDENT_SCENE_IMAGE")} disabled={uploading} />
                <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <div className="text-sm font-bold text-slate-700">Upload Accident Scene</div>
              </div>
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, "VEHICLE_DAMAGE_IMAGE")} disabled={uploading} />
                <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <div className="text-sm font-bold text-slate-700">Upload Vehicle Damage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
