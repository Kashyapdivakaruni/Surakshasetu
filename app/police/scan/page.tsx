"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Search, ShieldCheck, EyeOff, Loader2, ScanLine } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function PoliceScanPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const startScanner = () => {
    setScanning(true);
    setScanResult(null);
    setScanned(false);

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
          setToken(decodedText);
          handleScan(decodedText);
        }, (err) => {
          // ignore
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

  const handleScan = async (scannedToken?: string | React.FormEvent) => {
    if (typeof scannedToken === 'object' && 'preventDefault' in scannedToken) {
      scannedToken.preventDefault();
    }
    
    const tokenToUse = typeof scannedToken === 'string' ? scannedToken : token;
    if (!tokenToUse) return;

    setLoading(true);

    try {
      const res = await fetch("/api/police/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenToUse,
          location: { address: "Police Scan Location" }
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "QR Validated", description: "Identity data retrieved securely.", type: "success" });
        setScanResult(data);
        setScanned(true);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Scan Failed", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!scanResult) return;
    setLoading(true);

    try {
      if (scanResult.existingCase) {
        router.push(`/police/report/${scanResult.existingCase.id}`);
        return;
      }

      const res = await fetch("/api/police/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeId: scanResult.qrCode.id,
          citizenId: scanResult.qrCode.citizenId,
          vehicleId: scanResult.vehicle.id,
          accidentAddress: "Police Initiated Case"
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Case Initialized", description: "Navigating to FIR form...", type: "success" });
        router.push(`/police/report/${data.caseId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
      setLoading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {!scanned ? (
        <Card className="border-t-4 border-t-slate-800 shadow-xl mt-10 max-w-xl mx-auto">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-slate-800" />
            </div>
            <CardTitle className="text-2xl">Police Vehicle QR Scan</CardTitle>
            <CardDescription>
              Scan vehicle QR to access registration, owner details, and verify accident status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanning ? (
              <div className="space-y-4">
                <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-slate-200"></div>
                <Button variant="outline" onClick={stopScanner} className="w-full rounded-full">Cancel Scan</Button>
              </div>
            ) : (
              <div className="text-center py-4 mb-6">
                <Button onClick={startScanner} className="bg-slate-800 hover:bg-slate-900 text-white rounded-full font-bold px-8 h-12 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <ScanLine className="w-5 h-5 mr-2" /> Open Camera to Scan
                </Button>
              </div>
            )}

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or Enter Manually</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleScan} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-slate-700 font-bold">Secure Token / Full URL</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    id="token" 
                    placeholder="e.g. demo-secure-token-12345" 
                    className="pl-10 h-12 text-lg font-mono bg-slate-50"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>
              
              <Button type="submit" size="lg" className="w-full h-14 text-lg bg-slate-800 hover:bg-slate-900 shadow-lg" disabled={loading || !token}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify Vehicle Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Vehicle Data Verified</h1>
              <div className="text-sm text-green-600 mt-1 flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4" /> Identity Match Successful
              </div>
            </div>
            <Button variant="outline" onClick={() => setScanned(false)}>
              Scan Another QR
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-lg">Owner Identity</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Full Name</div>
                  <div className="font-bold">{scanResult?.citizenDetails?.fullName || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Age & Gender</div>
                  <div className="font-bold">{scanResult?.profileDetails?.age || "?"} Yrs, {scanResult?.profileDetails?.gender || "?"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-slate-500">Registered Address</div>
                  <div className="font-bold">{scanResult?.citizenDetails?.phone || "Phone Not Provided"}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-lg">Vehicle Registration</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Vehicle Number</div>
                  <div className="font-black text-xl text-slate-800">{scanResult?.vehicle?.vehicleNumber || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Type & Color</div>
                  <div className="font-bold">{scanResult?.vehicle?.vehicleType}, {scanResult?.vehicle?.vehicleColor}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Status</div>
                  <div className="font-bold text-green-600">Active / No Flags</div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-start gap-4">
                <EyeOff className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900">Privacy Data Filter Applied</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Medical conditions, allergies, and precise vitals are hidden from Police view as per Suraksha Setu privacy protocols. This data is only accessible to authorized EMS and Hospital personnel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-4">
            <Button size="lg" className="bg-slate-800 hover:bg-slate-900" onClick={handleCreateReport} disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {scanResult?.existingCase ? "Update Accident Report (FIR)" : "Create Accident Report (FIR)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
