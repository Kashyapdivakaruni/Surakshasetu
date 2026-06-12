"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, AlertTriangle, Building2, Activity, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function EMSDashboard() {
  const [stats, setStats] = useState({
    activeCases: 0,
    recentScans: 0,
    hospitalsNotified: 0,
    notificationsSent: 0
  });

  const [recentCase, setRecentCase] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/ems/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentCase(data.recentCase);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    }
    fetchDashboard();
  }, []);

  const cardVariants = {
    hover: { scale: 1.02, y: -4, transition: { type: "spring", stiffness: 300 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">EMS Command Center</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor active dispatches and coordinate emergency response.</p>
        </div>
        <Link href="/ems/scan">
          <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-600/20 rounded-full transition-transform hover:-translate-y-0.5">
            <ScanLine className="w-5 h-5 mr-2" /> Scan Emergency QR
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/ems/critical-cases" className="block focus:outline-none">
          <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
            <Card className="h-full border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-md transition-shadow rounded-2xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold text-red-800">Open Cases</CardTitle>
                <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-red-700">{stats.activeCases}</div>
                  <p className="text-xs text-red-600 mt-1 font-medium">Active dispatches</p>
                </div>
                <ArrowRight className="w-5 h-5 text-red-400" />
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/ems/recent-scans" className="block focus:outline-none">
          <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
            <Card className="h-full border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all rounded-2xl cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Recent QR Scans</CardTitle>
                <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors"><ScanLine className="w-4 h-4 text-blue-500" /></div>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900">{stats.recentScans}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Recorded scans</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/ems/nearby-hospitals" className="block focus:outline-none">
          <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
            <Card className="h-full border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all rounded-2xl cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">Nearby Hospitals</CardTitle>
                <div className="p-2 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors"><Building2 className="w-4 h-4 text-indigo-500" /></div>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900">{stats.hospitalsNotified}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Hospitals engaged</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        </Link>

        <Link href="/ems/notifications" className="block focus:outline-none">
          <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
            <Card className="h-full border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-green-300 transition-all rounded-2xl cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-bold text-slate-700 group-hover:text-green-700">Emergency Notifications</CardTitle>
                <div className="p-2 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors"><Activity className="w-4 h-4 text-green-500" /></div>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900">{stats.notificationsSent}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Alerts dispatched</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      </div>

      <div className="pt-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-[#0F284B]">Latest Dispatch</h2>
          <Link href="/ems/critical-cases" className="text-sm font-bold text-blue-600 hover:text-blue-800">View All</Link>
        </div>
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y border-0 bg-white">
              {recentCase ? (
                <Link href={`/ems/case/${recentCase.id}`} className="block focus:outline-none">
                  <div className="p-6 bg-white hover:bg-slate-50 transition cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="bg-red-50 border border-red-100 p-4 rounded-2xl shrink-0 group-hover:bg-red-100 transition-colors">
                        <AlertTriangle className="text-red-600 w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F284B] text-lg">Case #{recentCase.id.substring(0, 8).toUpperCase()} - Patient: {recentCase.citizen?.user?.fullName || "Unknown"}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-1 font-medium">
                          <MapPin className="w-4 h-4 mr-1 text-slate-400" /> {recentCase.accidentAddress || "Location pending"}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                      <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full mb-0 sm:mb-2 border border-orange-200">
                        {recentCase.status.replace("_", " ")}
                      </div>
                      <div className="text-xs text-slate-500 font-bold flex items-center group-hover:text-blue-600 transition-colors">
                        Open Case <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-10 text-center text-slate-500 flex flex-col items-center bg-slate-50/50">
                  <div className="bg-slate-100 p-4 rounded-full mb-3 border border-slate-200">
                    <ScanLine className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-bold text-[#0F284B]">No active dispatches right now.</p>
                  <p className="text-sm mt-1">Scan a QR code at an accident site to initiate a case.</p>
                  <Link href="/ems/scan">
                    <Button variant="outline" className="mt-4 rounded-full font-bold">Start Scan</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
