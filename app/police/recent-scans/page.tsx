"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecentScansPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/police/cases");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.scanLogs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.entityId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recent QR Scans</h1>
          <p className="text-muted-foreground mt-1">All recently scanned vehicles and emergency cases.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input 
          type="search" 
          placeholder="Search by case ID or citizen name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {loading ? (
              <div className="p-6 text-center text-slate-500 font-medium animate-pulse">Loading recent scans...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-medium">No recent scans found.</div>
            ) : (
              filteredLogs.map((l) => (
                <div key={l.id} className="p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-200 p-3 rounded-full shrink-0">
                      <Search className="text-slate-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Scan Action</div>
                      <div className="text-sm text-slate-600 mb-1">{l.details}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                        <span>{new Date(l.createdAt).toLocaleString()}</span>
                        <span>|</span>
                        <span>QR Token ID: {l.entityId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
