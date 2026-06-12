"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleFromQuery = searchParams.get("role") || "CITIZEN";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auto-fill test credentials based on the selected role
    if (roleFromQuery === "CITIZEN") { setEmail("citizen@demo.com"); setPassword("password123"); }
    else if (roleFromQuery === "EMS") { setEmail("ems@demo.com"); setPassword("password123"); }
    else if (roleFromQuery === "HOSPITAL") { setEmail("hospital@demo.com"); setPassword("password123"); }
    else if (roleFromQuery === "POLICE") { setEmail("police@demo.com"); setPassword("password123"); }
  }, [roleFromQuery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      window.location.href = data.redirectUrl || "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = (role: string) => {
    switch(role) {
      case "CITIZEN": return "Citizen";
      case "EMS": return "EMS / Paramedic";
      case "HOSPITAL": return "Hospital";
      case "POLICE": return "Police";
      default: return "Citizen";
    }
  };

  return (
    <div className="min-h-screen relative font-sans flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat contrast-[1.15] saturate-[1.1] opacity-100" style={{ backgroundImage: "url('https://i.ibb.co/RTR1Tn4H/Chat-GPT-Image-May-6-2026-05-08-50-PM.png')" }}></div>
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#EBF4FF]/30 via-white/60 to-[#F8FAFC]/95 backdrop-blur-[2px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#0F284B]">Suraksha <span className="text-orange-500">Setu</span></span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-[#0F284B] mb-2">
          {getRoleTitle(roleFromQuery)} Login
        </h2>
        <p className="text-center text-slate-600 mb-6 font-medium">
          Sign in to your secure portal
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="shadow-xl shadow-slate-200/50 border border-white bg-white/80 backdrop-blur-md rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-[#0F284B]">Credentials</CardTitle>
              <Link href="/select-role?mode=login" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition">
                Change Role
              </Link>
            </div>
            <CardDescription className="text-slate-500">Enter your details to securely sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0F284B] font-semibold">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#0F284B] font-semibold">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11"
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md transition-all hover:scale-[1.02] mt-6" disabled={loading}>
                {loading ? "Signing in..." : <><LogIn className="w-4 h-4 mr-2" /> Continue</>}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center text-sm text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link href={`/select-role?mode=signup`} className="font-bold text-orange-500 hover:text-orange-600 transition">
                Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
