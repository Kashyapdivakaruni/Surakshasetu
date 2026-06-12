"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { UserPlus, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleFromQuery = searchParams.get("role") || "CITIZEN";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: roleFromQuery,
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: roleFromQuery }));
  }, [roleFromQuery]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess("Account created successfully. You can now login.");
      setTimeout(() => {
        router.push(`/login?role=${formData.role}`);
      }, 2000);
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
          Create {getRoleTitle(roleFromQuery)} Account
        </h2>
        <p className="text-center text-slate-600 mb-6 font-medium">
          Join Suraksha Setu's secure emergency network.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="shadow-xl shadow-slate-200/50 border border-white bg-white/80 backdrop-blur-md rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-[#0F284B]">Registration</CardTitle>
              <Link href="/select-role?mode=signup" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition">
                Change Role
              </Link>
            </div>
            <CardDescription className="text-slate-500">Enter your details to create a secure account.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm font-bold">
                {success}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#0F284B] font-semibold">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0F284B] font-semibold">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#0F284B] font-semibold">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0F284B] font-semibold">Password</Label>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#0F284B] font-semibold">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500 h-11" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-[#0F284B] font-semibold">Assigned Portal</Label>
                <div className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-slate-100/50 px-3 text-sm text-slate-500 font-bold">
                  {getRoleTitle(formData.role)}
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md transition-all hover:scale-[1.02] mt-6" disabled={loading}>
                {loading ? "Creating Account..." : <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href={`/select-role?mode=login`} className="font-bold text-orange-500 hover:text-orange-600 transition">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
