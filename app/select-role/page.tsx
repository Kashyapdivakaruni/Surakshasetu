"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ShieldCheck, Activity, Building2, Users, ArrowRight, UserRound, ArrowLeft, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

function RoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: "CITIZEN",
      title: "Citizen",
      desc: "Register profile, vehicle, passengers, and emergency QR.",
      icon: UserRound,
      color: "text-blue-600",
      bg: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: "EMS",
      title: "EMS / Paramedic",
      desc: "Scan accident QR, verify identity, record vitals, and notify hospital.",
      icon: Activity,
      color: "text-orange-500",
      bg: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      id: "HOSPITAL",
      title: "Hospital",
      desc: "Receive incoming emergency cases and prepare treatment before arrival.",
      icon: Building2,
      color: "text-teal-600",
      bg: "bg-teal-50",
      borderColor: "border-teal-200"
    },
    {
      id: "POLICE",
      title: "Police",
      desc: "Verify vehicle details, coordinate case records, and file reports.",
      icon: ShieldCheck,
      color: "text-slate-600",
      bg: "bg-slate-100",
      borderColor: "border-slate-300"
    }
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    const targetPath = mode === "signup" ? "/register" : "/login";
    router.push(`${targetPath}?role=${selectedRole}`);
  };

  const selectedRoleObj = roles.find(r => r.id === selectedRole);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="flex flex-col min-h-screen relative font-sans overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat contrast-[1.15] saturate-[1.1] opacity-100" style={{ backgroundImage: "url('https://i.ibb.co/RTR1Tn4H/Chat-GPT-Image-May-6-2026-05-08-50-PM.png')" }}></div>
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#EBF4FF]/30 via-white/60 to-[#F8FAFC]/95 backdrop-blur-[2px]"></div>

      {/* Navbar */}
      <header className="w-full z-50 bg-white/40 backdrop-blur-md border-b border-white/40 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0F284B]">Suraksha <span className="text-orange-500">Setu</span></span>
          </Link>
          
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-[#0F284B] transition">
              Back to Home
            </Link>
            <Link href={mode === "login" ? "/select-role?mode=signup" : "/select-role?mode=login"}>
              <Button variant="outline" className="bg-white/60 hover:bg-white text-[#0F284B] border-slate-200 rounded-full font-bold shadow-sm transition-all">
                {mode === "login" ? "Sign Up" : "Login"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        <motion.div 
          className="w-full max-w-4xl flex flex-col items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-10">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-orange-100/80 border border-orange-200 text-orange-700 text-xs font-bold tracking-wider uppercase backdrop-blur-sm shadow-sm">
              Suraksha Setu Secure Access
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F284B] mb-3 tracking-tight">
              {mode === "login" ? "Choose Your Login Portal" : "Choose Your Registration Portal"}
            </h1>
            <p className="text-slate-600 text-lg max-w-xl mx-auto font-medium">
              Select your role to continue with secure role-based emergency access.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mb-8">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <motion.div
                  variants={itemVariants}
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    relative cursor-pointer overflow-hidden rounded-3xl p-6 transition-all duration-300
                    bg-white/75 backdrop-blur-lg
                    border
                    ${isSelected 
                      ? "border-orange-500 shadow-[0_8px_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500 -translate-y-1" 
                      : "border-[#0F284B]/10 hover:border-[#0F284B]/30 hover:shadow-[0_8px_30px_rgba(15,40,75,0.08)] hover:-translate-y-1 shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${role.bg} ${role.color} ${role.borderColor} border`}>
                      <role.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-bold text-[#0F284B] mb-1">{role.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{role.desc}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-5 right-5 text-orange-500 bg-white rounded-full shadow-sm"
                    >
                      <CheckCircle2 className="w-6 h-6 fill-orange-50" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div variants={itemVariants} className="w-full flex flex-col sm:flex-row items-center justify-between bg-white/60 backdrop-blur-md border border-white/50 p-4 sm:p-6 rounded-2xl shadow-sm gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left w-full">
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto bg-white/80 hover:bg-white text-[#0F284B] border-slate-200 rounded-full font-bold h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              
              <div className="flex-1 flex flex-col justify-center min-h-[48px]">
                {selectedRoleObj ? (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Selected Portal</p>
                    <p className="text-[#0F284B] font-bold text-lg">{selectedRoleObj.title}</p>
                  </motion.div>
                ) : (
                  <p className="text-slate-400 font-medium text-sm">Please select a role to continue</p>
                )}
              </div>
            </div>

            <Button 
              onClick={handleContinue}
              disabled={!selectedRole}
              className={`w-full sm:w-auto h-12 px-8 rounded-full font-bold shadow-lg transition-all ${
                selectedRole 
                ? "bg-[#0F284B] hover:bg-[#1A3A6B] text-white hover:scale-105" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {mode === "login" ? "Continue to Login" : "Continue to Sign Up"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
          
          <motion.p variants={itemVariants} className="text-xs text-slate-400 mt-8 font-medium text-center max-w-md">
            Role selection improves navigation. Final access is verified securely after authentication.
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <RoleSelectionContent />
    </Suspense>
  );
}
