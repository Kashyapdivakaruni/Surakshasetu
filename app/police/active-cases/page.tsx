"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ActiveCasesPage() {
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

  const filteredCases = activeCases.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.citizen?.user?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Active Accident Cases</h1>
          <p className="text-muted-foreground mt-1">All ongoing emergency cases requiring police oversight.</p>
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
              <div className="p-6 text-center text-slate-500 font-medium animate-pulse">Loading active cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-medium">No active cases found.</div>
            ) : (
              filteredCases.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full shrink-0">
                      <ShieldCheck className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Case #{c.id.substring(0,8).toUpperCase()} - {c.citizen?.user?.fullName || "Unverified"}</div>
                      <div className="text-sm text-slate-500 flex items-center mt-1 gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          c.identityStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {c.identityStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                        <span>|</span>
                        <span className="font-medium">{c.accidentAddress || "Location Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Link href={`/police/case/${c.id}`}>
                      <Button variant="outline" size="sm" className="border-slate-300 font-bold">Open Case</Button>
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
