"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, FileText, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { PoliceDashboardMap } from "@/components/maps/PoliceDashboardMap";

export default function PoliceDashboard() {
  const [cases, setCases] = useState<any[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/police/cases");
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases);
          setScanCount(data.scanLogsCount || 0);
        }
      } catch (err) {
        console.error("Failed to load police cases", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeCases = cases.filter(c => c.status !== "CLOSED");
  const pendingVerifications = activeCases.filter(c => c.identityStatus !== "VERIFIED");
  const pendingFIRs = activeCases.filter(c => !c.policeReports?.length || !c.policeReports[0]?.firNumber);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Police Control Dashboard</h1>
          <p className="text-muted-foreground mt-1">Verify accident vehicles and manage official reports.</p>
        </div>
        <Link href="/police/scan">
          <Button size="lg" className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-12 px-8 shadow-lg">
            <ScanLine className="w-5 h-5 mr-2" /> Scan Vehicle QR
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Live Incident Map</h2>
          <PoliceDashboardMap cases={activeCases} />
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4">Overview</h2>
          <Link href="/police/active-cases" className="block">
            <Card className="hover:border-blue-400 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Accident Cases</CardTitle>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-3xl font-bold animate-pulse text-slate-300">...</div> : <div className="text-3xl font-bold">{activeCases.length}</div>}
                <p className="text-xs text-muted-foreground mt-1">Ongoing investigations</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/police/fir-reports" className="block">
            <Card className="hover:border-orange-400 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">FIRs Pending</CardTitle>
                <FileText className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-3xl font-bold text-orange-600 animate-pulse">...</div> : <div className="text-3xl font-bold text-orange-600">{pendingFIRs.length}</div>}
                <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/police/recent-scans" className="block">
            <Card className="hover:border-slate-400 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent QR Scans</CardTitle>
                <Search className="w-4 h-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-3xl font-bold animate-pulse text-slate-300">...</div> : <div className="text-3xl font-bold">{scanCount}</div>}
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Pending Verifications</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {pendingVerifications.length === 0 && !loading && (
              <div className="p-6 text-center text-slate-500 font-medium">No pending cases awaiting verification.</div>
            )}
            {pendingVerifications.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-full shrink-0">
                    <FileText className="text-orange-600 w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Case #{c.id.substring(0,8).toUpperCase()} - {c.citizen?.user?.fullName || "Unverified"}</div>
                    <div className="text-sm text-slate-500 flex items-center mt-1">
                      {c.accidentAddress || "Location Unknown"}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Link href={`/police/case/${c.id}`}>
                    <Button variant="outline" size="sm" className="border-slate-300 font-bold">Start Verification</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
