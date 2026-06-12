"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, Copy, Printer, AlertTriangle, RefreshCw } from "lucide-react";
import QRCode from "react-qr-code";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import QRCodeLib from "qrcode";

export default function CitizenQRPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  
  const [qrToken, setQrToken] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  
  const [appUrl, setAppUrl] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchQR();
  }, []);

  const fetchQR = async () => {
    try {
      const res = await fetch("/api/citizen/qr");
      const data = await res.json();
      
      if (res.ok && data.qrCode) {
        setQrToken(data.qrCode.qrToken);
        setVehicleNumber(data.qrCode.vehicle?.vehicleNumber || "UNKNOWN");
        setCreatedAt(new Date(data.qrCode.createdAt).toLocaleDateString());
      } else {
        toast({ title: "No QR Found", description: data.error || "Please register a vehicle first.", type: "error" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch QR details", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const regenerateQR = async () => {
    if (!confirm("WARNING: Regenerating your QR will invalidate the old QR instantly. Any printed stickers with the old QR will stop working immediately. Are you absolutely sure?")) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch("/api/citizen/qr/regenerate", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.qrCode) {
        setQrToken(data.qrCode.qrToken);
        toast({ title: "Success", description: "New secure QR generated successfully.", type: "success" });
      } else {
        throw new Error(data.error || "Failed to regenerate");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setRegenerating(false);
    }
  };

  const qrUrl = `${appUrl}/qr/${qrToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl);
    toast({ title: "Copied", description: "QR URL copied to clipboard", type: "success" });
  };

  const copyToken = () => {
    navigator.clipboard.writeText(qrToken);
    toast({ title: "Copied", description: "Secure Code copied to clipboard", type: "success" });
  };

  const downloadQR = async () => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 1024, margin: 2, color: { dark: '#0F284B', light: '#ffffff' } });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `suraksha-setu-qr-${vehicleNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Downloaded", description: "High-resolution QR saved.", type: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate PNG", type: "error" });
    }
  };

  const printQR = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading secure QR...</div>;
  }

  if (!qrToken) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-[#0F284B] text-lg">No Active QR Found</h3>
        <p className="text-sm text-slate-500 mt-1">Please ensure your profile is complete and a vehicle is registered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-10">
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">Emergency Vehicle QR</h1>
        <p className="text-slate-500 mt-1 font-medium">Generate, print, and stick this permanent QR code on your vehicle.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 print:block print:w-full">
        {/* Printable Section */}
        <Card className="border border-orange-200 shadow-xl relative overflow-hidden bg-white print:shadow-none print:border-none print:w-[400px] print:mx-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-bl-full -z-10 opacity-5 print:hidden"></div>
          <CardHeader className="text-center pb-2 border-b border-slate-100 print:border-b-2 print:border-black">
            <CardTitle className="text-2xl font-extrabold tracking-tight text-[#0F284B] print:text-black">SURAKSHA SETU</CardTitle>
            <CardDescription className="font-bold text-orange-600 text-xl print:text-black">{vehicleNumber}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-6">
            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 mb-4 print:shadow-none print:border-4 print:border-black">
              {appUrl && (
                <QRCode
                  value={qrUrl}
                  size={220}
                  level="H"
                  fgColor="#0F284B"
                  className="mx-auto print:hidden"
                />
              )}
              {appUrl && (
                <div className="hidden print:block">
                  <QRCode value={qrUrl} size={300} level="H" fgColor="#000000" />
                </div>
              )}
            </div>
            
            <div className="text-center mb-6">
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">Secure Emergency ID</p>
              <p className="font-mono text-sm font-bold text-[#0F284B] bg-slate-100 px-3 py-1 rounded print:text-black">{qrToken.substring(0, 8)}...{qrToken.substring(qrToken.length - 4)}</p>
            </div>

            <div className="hidden print:block text-center space-y-2 mt-4 max-w-sm">
              <p className="font-bold text-sm">EMERGENCY SCAN ONLY</p>
              <p className="text-xs text-gray-600">Place this QR on windshield/dashboard where EMS or Police can scan.</p>
              <p className="text-xs text-gray-500 italic mt-4 border-t pt-2">QR contains no personal or medical data.</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-xs print:hidden">
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button onClick={downloadQR} className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md"><Download className="w-4 h-4 mr-2"/> PNG</Button>
                <Button onClick={printQR} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-md"><Printer className="w-4 h-4 mr-2"/> Print</Button>
              </div>
              <Button onClick={copyToClipboard} variant="outline" className="w-full flex items-center gap-2 rounded-full border-slate-200 text-[#0F284B] font-semibold h-11">
                <Copy className="w-4 h-4" /> Copy QR URL
              </Button>
              <Button onClick={copyToken} variant="outline" className="w-full flex items-center gap-2 rounded-full border-slate-200 text-[#0F284B] font-semibold h-11">
                <Copy className="w-4 h-4" /> Copy Secure Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section (Hidden on Print) */}
        <div className="space-y-6 print:hidden">
          <Card className="bg-blue-50/50 border border-blue-100 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-[#0F284B] mb-2">Privacy-First Security</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                    This QR code <strong>does not</strong> store your personal details, medical records, or emergency contacts. It only contains a secure, random emergency token.
                  </p>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    If scanned by a normal user, they will only see a protected access page. Sensitive data is unlocked and visible <strong>only to authorized EMS and Police</strong> personnel after they log in to the Suraksha Setu platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg text-[#0F284B]">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Placement Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm font-medium">
                <li>Print the QR code on a waterproof sticker.</li>
                <li><strong>Cars:</strong> Stick it inside the windshield near the FASTag area.</li>
                <li><strong>Bikes/Two-wheelers:</strong> Stick it near the dashboard or fuel tank.</li>
                <li>Ensure the QR is not obscured by tint or dirt.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-red-200 bg-red-50/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-red-800 text-sm mb-1">Compromised QR?</h3>
                <p className="text-xs text-red-600 font-medium max-w-[200px]">Regenerating will invalidate the old sticker permanently.</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={regenerateQR}
                disabled={regenerating}
                className="rounded-full font-bold shadow-sm px-6"
              >
                {regenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Regenerate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
