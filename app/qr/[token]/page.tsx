"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck, Activity, Users, Car, Phone } from "lucide-react";

export default function QRScanPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<{ message: string; type: "AUTH" | "DENIED" | "INACTIVE" | "NOT_FOUND" | "ERROR" } | null>(null);

  useEffect(() => {
    async function fetchQRData() {
      try {
        const res = await fetch(`/api/qr/${token}`);
        const json = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            setError({ message: json.message || "Authorized EMS & Police Personnel Only", type: "AUTH" });
          } else if (res.status === 403 && json.message?.includes("longer active")) {
            setError({ message: json.error, type: "INACTIVE" });
          } else if (res.status === 403) {
            setError({ message: json.message || "Access Denied", type: "DENIED" });
          } else if (res.status === 404) {
            setError({ message: "Invalid QR code", type: "NOT_FOUND" });
          } else {
            setError({ message: json.error || "Failed to fetch QR data", type: "ERROR" });
          }
        } else {
          setData(json.data);
        }
      } catch (err) {
        setError({ message: "An unexpected error occurred", type: "ERROR" });
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchQRData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
          <p className="text-slate-500 font-medium">Securing connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans">
        <div className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat contrast-[1.15] saturate-[1.1] opacity-100" style={{ backgroundImage: "url('https://i.ibb.co/RTR1Tn4H/Chat-GPT-Image-May-6-2026-05-08-50-PM.png')" }}></div>
        <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#EBF4FF]/30 via-white/60 to-[#F8FAFC]/95 backdrop-blur-[2px]"></div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <Card className="shadow-xl border border-white bg-white/90 backdrop-blur-md rounded-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                {error.type === "AUTH" || error.type === "DENIED" ? 
                  <ShieldAlert className="w-8 h-8 text-red-600" /> : 
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                }
              </div>
              <CardTitle className="text-2xl text-red-700">
                {error.type === "AUTH" ? "Access Restricted" : 
                 error.type === "INACTIVE" ? "QR Inactive" : 
                 error.type === "DENIED" ? "Access Denied" : "Error"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 font-medium mb-8">{error.message}</p>
              
              {error.type === "AUTH" && (
                <Button 
                  onClick={() => router.push(`/select-role?mode=login`)}
                  className="w-full h-12 bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md"
                >
                  Login as Authorized Personnel
                </Button>
              )}
              {error.type !== "AUTH" && (
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/`)}
                  className="w-full h-12 rounded-full font-bold border-slate-300 text-slate-700"
                >
                  Return to Home
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state rendering (EMS / POLICE)
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-green-100/50 border border-green-200 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-green-800 font-bold text-lg">Secure Access Granted</h2>
              <p className="text-green-600 text-sm font-medium">Session recorded in audit log.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} className="rounded-full">
            Exit
          </Button>
        </div>

        {data.citizenDetails && (
          <Card className="shadow-sm rounded-2xl overflow-hidden border-slate-200">
            <CardHeader className="bg-slate-100/50 pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg text-[#0F284B]">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Identity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 font-medium">Full Name</p>
                <p className="text-lg font-bold text-slate-900">{data.citizenDetails.fullName}</p>
              </div>
              {data.citizenDetails.phone && (
                <div>
                  <p className="text-sm text-slate-500 font-medium">Phone</p>
                  <p className="text-lg font-bold text-slate-900">{data.citizenDetails.phone}</p>
                </div>
              )}
              {data.profileDetails && data.profileDetails.bloodGroup && (
                <div>
                  <p className="text-sm text-slate-500 font-medium">Blood Group</p>
                  <p className="text-lg font-bold text-red-600">{data.profileDetails.bloodGroup}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.vehicle && (
          <Card className="shadow-sm rounded-2xl overflow-hidden border-slate-200">
            <CardHeader className="bg-slate-100/50 pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg text-[#0F284B]">
                <Car className="w-5 h-5 text-orange-600" /> Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 font-medium">Vehicle Number</p>
                <p className="text-lg font-bold text-slate-900">{data.vehicle.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Type & Color</p>
                <p className="text-lg font-bold text-slate-900">{data.vehicle.vehicleColor} {data.vehicle.vehicleType}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data.medicalInfo && (
          <Card className="shadow-sm rounded-2xl overflow-hidden border-red-100 border">
            <CardHeader className="bg-red-50/50 pb-4 border-b border-red-100">
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <Activity className="w-5 h-5 text-red-600" /> Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {data.medicalInfo.allergies && (
                <div>
                  <p className="text-sm text-slate-500 font-medium">Allergies</p>
                  <p className="text-base font-medium text-slate-900">{data.medicalInfo.allergies}</p>
                </div>
              )}
              {data.medicalInfo.currentMedications && (
                <div>
                  <p className="text-sm text-slate-500 font-medium">Current Medications</p>
                  <p className="text-base font-medium text-slate-900">{data.medicalInfo.currentMedications}</p>
                </div>
              )}
              {data.medicalInfo.previousConditions && (
                <div>
                  <p className="text-sm text-slate-500 font-medium">Previous Conditions</p>
                  <p className="text-base font-medium text-slate-900">{data.medicalInfo.previousConditions}</p>
                </div>
              )}
              {data.profileDetails && data.profileDetails.emergencyContactPhone && (
                <div className="bg-orange-50 p-4 rounded-xl mt-4 border border-orange-100">
                  <p className="text-sm text-orange-800 font-bold flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4" /> Emergency Contact
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {data.profileDetails.emergencyContactName} - {data.profileDetails.emergencyContactPhone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.passengers && data.passengers.length > 0 && (
          <Card className="shadow-sm rounded-2xl overflow-hidden border-slate-200">
            <CardHeader className="bg-slate-100/50 pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg text-[#0F284B]">
                <Users className="w-5 h-5 text-teal-600" /> Possible Passengers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.passengers.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.age} yrs • {p.gender} • {p.relationship}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
