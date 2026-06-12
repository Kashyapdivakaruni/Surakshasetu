"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function PoliceHistoryPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/police/cases");
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const historyCases = cases.filter(c => 
    c.status === "CLOSED" || c.policeReports?.some((r: any) => r.firNumber)
  );

  const filteredCases = historyCases.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.citizen?.user?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.policeReports?.[0]?.firNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Case History</h1>
          <p className="text-muted-foreground mt-1">Archived accident reports and filed FIRs.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input 
          type="search" 
          placeholder="Search cases by ID, name, or FIR..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline"><Search className="w-4 h-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {loading ? (
              <div className="p-6 text-center text-slate-500 font-medium animate-pulse">Loading history...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-medium">No history cases found.</div>
            ) : (
              filteredCases.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full shrink-0">
                      <CheckCircle2 className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Case #{c.id.substring(0,8).toUpperCase()} - {c.citizen?.user?.fullName || "Unverified"}</div>
                      <div className="text-sm text-slate-500 flex items-center mt-1 gap-2">
                        {c.policeReports?.[0]?.firNumber ? (
                          <span className="font-mono text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">{c.policeReports[0].firNumber}</span>
                        ) : null}
                        <span>{c.accidentAddress || "Location Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Link href={`/police/case/${c.id}`}>
                      <Button variant="outline" size="sm" className="border-slate-300 font-bold">View Details</Button>
                    </Link>
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
