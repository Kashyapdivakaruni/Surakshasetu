"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, AlertTriangle, ShieldCheck, HeartPulse, UserCircle, Car, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

export default function EMSScannerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token");

  const [manualToken, setManualToken] = useState(initialToken || "");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  // Verification states
  const [identityVerified, setIdentityVerified] = useState<string | null>(null);
  const [severity, setSeverity] = useState("HIGH");
  const [isUnknownPatient, setIsUnknownPatient] = useState(false);
  
  // Manual unverified patient states
  const [manualName, setManualName] = useState("");
  const [manualAge, setManualAge] = useState("");
  const [manualGender, setManualGender] = useState("");

  const [passengerVerifications, setPassengerVerifications] = useState<Record<string, {
    status: string; // "VERIFIED" | "UNVERIFIED"
    severity?: string;
  }>>({});
  const [selectedPassengerDetails, setSelectedPassengerDetails] = useState<any>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (initialToken) {
      handleManualScan(initialToken);
    }
  }, [initialToken]);

  const startScanner = () => {
    setScanning(true);
    setScanResult(null);

    // setTimeout is used to ensure the div 'reader' is rendered
    setTimeout(() => {
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
          false
        );
        scannerRef.current = scanner;

        scanner.render((decodedText) => {
          scanner.clear();
          setScanning(false);
          handleManualScan(decodedText);
        }, (err) => {
          // Ignore frequent scan errors
        });
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualScan = async (tokenToUse?: string) => {
    const token = typeof tokenToUse === 'string' ? tokenToUse : manualToken;
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ems/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          location: { lat: 17.3850, lng: 78.4867, address: "Outer Ring Road, Hyderabad" } // Mock loc
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "QR Validated", description: "Identity data retrieved securely.", type: "success" });
        setScanResult(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Scan Failed", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const createEmergencyCase = async () => {
    if (!scanResult && !isUnknownPatient) return;
    if (!isUnknownPatient && !identityVerified) {
      toast({ title: "Action Required", description: "Please verify identity status first.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // If there's an existing active case, just redirect to it
      if (scanResult && scanResult.existingCase) {
        router.push(`/ems/case/${scanResult.existingCase.id}`);
        return;
      }

      const res = await fetch("/api/ems/case/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeId: scanResult?.qrCode?.id || undefined,
          citizenId: scanResult?.qrCode?.citizenId || undefined,
          vehicleId: scanResult?.vehicle?.id || undefined,
          accidentLatitude: 17.3850,
          accidentLongitude: 78.4867,
          accidentAddress: "Unknown Location",
          severityLevel: severity,
          identityStatus: isUnknownPatient ? "UNVERIFIED" : identityVerified,
          manualPatientName: manualName,
          manualPatientAge: parseInt(manualAge) || undefined,
          manualPatientGender: manualGender,
          passengersData: Object.entries(passengerVerifications).map(([id, data]) => ({
            passengerId: id,
            status: data.status,
            severity: data.severity || "MEDIUM",
            name: scanResult?.passengers?.find((p:any) => p.id === id)?.name
          }))
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Case Created", description: "Emergency case has been initiated.", type: "success" });
        router.push(`/ems/case/${data.caseId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-10 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-3">
            <ScanLine className="w-8 h-8 text-red-600" /> QR Scanner
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Scan patient vehicle QR to fetch secure emergency records.</p>
        </div>
        {!scanResult && !isUnknownPatient && (
          <Button 
            onClick={() => { setIsUnknownPatient(true); setIdentityVerified("UNVERIFIED"); }} 
            className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md h-11"
          >
            Enter Unknown Patient Details
          </Button>
        )}
      </div>

      {!scanResult && !isUnknownPatient ? (
        <div className="grid gap-6">
          <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              {scanning ? (
                <div className="space-y-4">
                  <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-red-200"></div>
                  <Button variant="outline" onClick={stopScanner} className="w-full rounded-full">Cancel Scan</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                    <ScanLine className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="font-bold text-xl text-[#0F284B] mb-2">Camera Scanner</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Position the QR code inside the frame. Data will be fetched securely.</p>
                  <Button onClick={startScanner} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold px-8 h-12 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    Open Camera to Scan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-slate-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center"><Search className="w-4 h-4 mr-2"/> Manual Fallback</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter QR token manually..." 
                  value={manualToken} 
                  onChange={(e) => setManualToken(e.target.value)}
                  className="bg-white border-slate-300 focus:border-red-500 rounded-full h-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <Button onClick={() => handleManualScan()} disabled={loading || !manualToken} className="rounded-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white px-6 h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isUnknownPatient ? (
        <Card className="border-[#0F284B] shadow-lg rounded-2xl bg-[#0F284B] text-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-blue-900 pb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" /> Unknown Patient Emergency
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsUnknownPatient(false)} className="text-blue-200 hover:text-white hover:bg-white/10">Cancel</Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-bold text-blue-200 flex items-center">
                <UserCircle className="w-4 h-4 mr-2" /> Basic Information
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input 
                  placeholder="Temporary Patient Name (e.g. Unknown Male 1)" 
                  value={manualName} 
                  onChange={(e) => setManualName(e.target.value)}
                  className="bg-white/10 border-blue-400 text-white placeholder:text-blue-200"
                  required
                />
                <Input 
                  type="number"
                  placeholder="Approx. Age" 
                  value={manualAge} 
                  onChange={(e) => setManualAge(e.target.value)}
                  className="bg-white/10 border-blue-400 text-white placeholder:text-blue-200"
                />
                <select 
                  value={manualGender} 
                  onChange={(e) => setManualGender(e.target.value)}
                  className="bg-[#0F284B] border border-blue-400 text-white rounded-md p-2 text-sm w-full outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <select 
                  value={severity} 
                  onChange={(e) => setSeverity(e.target.value)}
                  className="bg-[#0F284B] border border-red-400 text-white rounded-md p-2 text-sm w-full outline-none"
                >
                  <option value="HIGH">HIGH SEVERITY</option>
                  <option value="CRITICAL">CRITICAL SEVERITY</option>
                  <option value="MEDIUM">MEDIUM SEVERITY</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/50">
              <Button 
                onClick={createEmergencyCase} 
                disabled={loading || !manualName} 
                className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "CREATE EMERGENCY CASE"}
                {!loading && <ArrowRight className="w-6 h-6 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50/50 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="font-bold text-green-900">Secure Access Granted</h2>
                  <p className="text-xs text-green-700 font-medium">Session recorded in EMS Audit Logs.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScanResult(null)} className="rounded-full border-green-300 text-green-800 hover:bg-green-100">
                Rescan
              </Button>
            </CardContent>
          </Card>

          {scanResult.existingCase && (
            <div className="bg-orange-100 border border-orange-200 p-4 rounded-xl flex items-start justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-orange-900">Active Case Exists</h3>
                  <p className="text-sm text-orange-800">There is already an ongoing emergency case for this QR.</p>
                </div>
              </div>
              <Button onClick={() => router.push(`/ems/case/${scanResult.existingCase.id}`)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold shadow-md">
                View Open Case
              </Button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#0F284B] flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <UserCircle className="w-5 h-5 text-blue-500" /> Patient Identity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {scanResult.citizenDetails?.profilePhoto ? (
                      <img src={scanResult.citizenDetails.profilePhoto} alt="Patient" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border-2 border-slate-200">
                        <UserCircle className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 font-bold">FULL NAME</p>
                      <p className="font-bold text-xl text-slate-900">{scanResult.citizenDetails?.fullName || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-bold">AGE & GENDER</p>
                      <p className="font-medium text-slate-800">{scanResult.profileDetails?.age || "?"} • {scanResult.profileDetails?.gender || "?"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">BLOOD GROUP</p>
                      <p className="font-bold text-red-600 text-lg">{scanResult.profileDetails?.bloodGroup || "?"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-red-50/30 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4 border-b border-red-100 pb-2">
                  <HeartPulse className="w-5 h-5 text-red-500" /> Critical Medical Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-red-800/60 font-bold">KNOWN ALLERGIES</p>
                    <p className="font-bold text-red-700">{scanResult.medicalInfo?.allergies || "None declared"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-800/60 font-bold">CONDITIONS & MEDS</p>
                    <p className="font-medium text-red-900 text-sm">
                      {scanResult.medicalInfo?.previousConditions || "No conditions"} <br/>
                      {scanResult.medicalInfo?.currentMedications || "No medications"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#0F284B] flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Car className="w-5 h-5 text-indigo-500" /> Vehicle & Passengers
                </h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">VEHICLE INFO</p>
                    <p className="font-bold text-lg text-slate-900">{scanResult.vehicle?.vehicleNumber}</p>
                    <p className="text-sm font-medium text-slate-600">{scanResult.vehicle?.vehicleColor} {scanResult.vehicle?.vehicleType}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold mb-2">POSSIBLE PASSENGERS</p>
                    {scanResult.passengers?.length > 0 ? (
                      <div className="space-y-4">
                        {scanResult.passengers.map((p: any) => (
                          <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                            <div className="flex gap-4">
                              {p.photo ? (
                                <img src={p.photo} alt={p.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shrink-0" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-2 border-slate-200">
                                  <UserCircle className="w-8 h-8 text-slate-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{p.relationship} • {p.age} Yrs • {p.gender}</p>
                                  </div>
                                  <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedPassengerDetails(p)}>View Details</Button>
                                </div>
                                <div className="mt-2 text-xs space-y-1">
                                  {p.healthConditions && <p className="truncate"><span className="font-bold text-slate-600">Conditions:</span> {p.healthConditions}</p>}
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Verify Co-Passenger Match</p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant={passengerVerifications[p.id]?.status === "VERIFIED" ? "default" : "outline"}
                                  onClick={() => setPassengerVerifications(prev => ({...prev, [p.id]: { status: "VERIFIED", severity: "MEDIUM" }}))}
                                  className={`flex-1 h-8 text-xs ${passengerVerifications[p.id]?.status === 'VERIFIED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                >
                                  Match Confirmed
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={passengerVerifications[p.id]?.status === "UNVERIFIED" ? "default" : "outline"}
                                  onClick={() => setPassengerVerifications(prev => ({...prev, [p.id]: { status: "UNVERIFIED", severity: "MEDIUM" }}))}
                                  className={`flex-1 h-8 text-xs ${passengerVerifications[p.id]?.status === 'UNVERIFIED' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                                >
                                  Not Confirmed
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No passengers registered</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#0F284B] shadow-lg rounded-2xl bg-[#0F284B] text-white">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" /> Initiate Emergency Response
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-blue-200 font-bold mb-2">1. VERIFY IDENTITY</p>
                  <div className="flex gap-2">
                    <Button 
                      variant={identityVerified === "VERIFIED" ? "default" : "outline"}
                      onClick={() => setIdentityVerified("VERIFIED")}
                      className={`flex-1 rounded-full text-xs font-bold ${identityVerified === 'VERIFIED' ? 'bg-green-500 hover:bg-green-600 border-transparent text-white' : 'bg-transparent border-blue-400 text-blue-100 hover:bg-white/10 hover:text-white'}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
                    </Button>
                    <Button 
                      variant={identityVerified === "UNVERIFIED" ? "default" : "outline"}
                      onClick={() => setIdentityVerified("UNVERIFIED")}
                      className={`flex-1 rounded-full text-xs font-bold ${identityVerified === 'UNVERIFIED' ? 'bg-orange-500 hover:bg-orange-600 border-transparent text-white' : 'bg-transparent border-blue-400 text-blue-100 hover:bg-white/10 hover:text-white'}`}
                    >
                      Unverified
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-200 font-bold mb-2">2. ASSESS SEVERITY</p>
                  <div className="flex gap-2">
                    {["HIGH", "CRITICAL"].map(s => (
                      <Button 
                        key={s}
                        variant={severity === s ? "default" : "outline"}
                        onClick={() => setSeverity(s)}
                        className={`flex-1 rounded-full text-xs font-bold ${severity === s ? 'bg-red-600 hover:bg-red-700 border-transparent text-white' : 'bg-transparent border-blue-400 text-blue-100 hover:bg-white/10 hover:text-white'}`}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {identityVerified === "UNVERIFIED" && (
                <div className="bg-red-500/20 p-4 rounded-xl border border-red-400 space-y-4">
                  <p className="text-sm font-bold text-red-100 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Manual Patient Entry Required
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input 
                      placeholder="Approx. Patient Name (optional)" 
                      value={manualName} 
                      onChange={(e) => setManualName(e.target.value)}
                      className="bg-white/10 border-blue-400 text-white placeholder:text-blue-200"
                    />
                    <Input 
                      type="number"
                      placeholder="Approx. Age" 
                      value={manualAge} 
                      onChange={(e) => setManualAge(e.target.value)}
                      className="bg-white/10 border-blue-400 text-white placeholder:text-blue-200"
                    />
                    <select 
                      value={manualGender} 
                      onChange={(e) => setManualGender(e.target.value)}
                      className="bg-[#0F284B] border border-blue-400 text-white rounded-md p-2 text-sm w-full outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-blue-900/50">
                <Button 
                  onClick={createEmergencyCase} 
                  disabled={loading || !identityVerified || scanResult.existingCase} 
                  className="w-full h-14 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "CREATE EMERGENCY CASE"}
                  {!loading && <ArrowRight className="w-6 h-6 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Passenger Full Details Modal */}
      {selectedPassengerDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-0">
              <div className="bg-[#0F284B] p-4 text-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-xl">Passenger Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPassengerDetails(null)} className="text-white hover:bg-white/20">Close</Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  {selectedPassengerDetails.photo ? (
                    <img src={selectedPassengerDetails.photo} alt="Passenger" className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <UserCircle className="w-10 h-10 text-slate-400" />
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
    </div>
  );
}
