import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-t-4 border-t-red-600 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-slate-900">Access Denied</CardTitle>
          <CardDescription className="text-base mt-2">
            You do not have the required role permissions to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <p className="text-slate-600 text-sm mb-6">
            Suraksha Setu uses strict Role-Based Access Control (RBAC). Sensitive medical and emergency data is strictly siloed between Citizens, EMS, Hospitals, and Police.
          </p>
          <Link href="/login">
            <Button className="w-full bg-slate-800 hover:bg-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
