"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, ArrowRight, User, Car, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function RecentScansPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      try {
        const res = await fetch("/api/ems/recent-scans");
        if (res.ok) {
          const data = await res.json();
          setScans(data.scans);
        }
      } catch (err) {
        console.error("Failed to fetch scans");
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading recent scans...</div>;

  return (
    <div className="space-y-6 font-sans pb-10 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-3">
          <ScanLine className="w-8 h-8 text-blue-600" /> Recent QR Scans
        </h1>
        <p className="text-slate-500 mt-1 font-medium">History of all emergency QR codes scanned by your device.</p>
      </div>

      {scans.length === 0 ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="bg-blue-50 p-6 rounded-full mb-4 border border-blue-100">
            <ScanLine className="w-12 h-12 text-blue-500" />
          </div>
          <p className="font-bold text-xl text-[#0F284B]">No QR scans recorded yet.</p>
          <p className="text-sm mt-2 text-slate-500 max-w-md">Once you scan an emergency QR sticker, it will appear here in your history.</p>
          <Link href="/ems/scan" className="mt-6">
            <Button className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold px-8 shadow-md">
              Start Scan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan, i) => (
            <motion.div key={scan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-full shrink-0">
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0F284B] text-lg">{scan.citizenName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm font-medium text-slate-500">
                        <span className="flex items-center"><Car className="w-3 h-3 mr-1"/> {scan.vehicleNumber}</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(scan.createdAt).toLocaleString()}</span>
                      </div>
                      {scan.details && <p className="text-xs text-slate-400 mt-2">{scan.details}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Link href={`/ems/scan?token=${scan.qrToken}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors">
                      View QR Data <ArrowRight className="w-4 h-4 ml-2" />
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
