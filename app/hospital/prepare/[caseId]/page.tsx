"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HospitalPreparePage({ params }: { params: { caseId: string } }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      router.push(`/hospital/case/${params.caseId}`);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hospital/dashboard`}>
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prepare Ward</h1>
          <p className="text-muted-foreground mt-1">Assign resources for Case #{params.caseId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Doctor</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Dr. Sharma (Trauma)</option>
              <option>Dr. Gupta (Ortho)</option>
              <option>Dr. Singh (General)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Bed/Ward</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Trauma Bay 1</option>
              <option>Trauma Bay 2</option>
              <option>ICU Bed 4</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Preparation Notes</label>
            <textarea 
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="E.g., Prepare X-Ray, order blood type O+..."
            />
          </div>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 mt-4" onClick={handleSave} disabled={saved}>
            {saved ? "Resources Assigned" : <><Save className="w-4 h-4 mr-2" /> Save & Update Status</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
