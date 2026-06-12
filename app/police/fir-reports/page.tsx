"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function FIRReportsPage() {
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

  const activeCases = cases.filter(c => c.status !== "CLOSED");
  const firCases = activeCases.filter(c => c.policeReports?.length > 0);

  const filteredCases = firCases.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.policeReports?.[0]?.firNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">FIR Reports</h1>
          <p className="text-muted-foreground mt-1">Manage pending and generated official FIRs.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input 
          type="search" 
          placeholder="Search by FIR number or Case ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {loading ? (
              <div className="p-6 text-center text-slate-500 font-medium animate-pulse">Loading reports...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-medium">No FIR reports found.</div>
            ) : (
              filteredCases.map((c) => {
                const report = c.policeReports[0];
                return (
                  <div key={c.id} className="p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-100 p-3 rounded-full shrink-0">
                        <FileText className="text-orange-600 w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {report.firNumber ? `FIR: ${report.firNumber}` : `Case #${c.id.substring(0,8).toUpperCase()} - FIR Pending`}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center mt-1 gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            report.firNumber ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {report.firNumber ? 'FILED' : 'PENDING'}
                          </span>
                          <span>|</span>
                          <span className="font-medium">{c.accidentAddress || "Location Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Link href={`/police/report/${c.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-300 font-bold">
                          {report.firNumber ? "View Report" : "Generate FIR"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
