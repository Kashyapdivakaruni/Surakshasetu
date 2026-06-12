"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, Activity, Building2, MapPin, Bell, FileText, 
  Lock, Users, ArrowRight, Smartphone, Car, Map 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = ["how-it-works", "features"];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
      else setActiveSection("");
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden font-sans relative">
      
      {/* Global Background */}
      <div className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat contrast-[1.15] saturate-[1.1] opacity-100" style={{ backgroundImage: "url('https://i.ibb.co/RTR1Tn4H/Chat-GPT-Image-May-6-2026-05-08-50-PM.png')" }}></div>
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-[#EBF4FF]/10 via-white/30 to-white/85"></div>
      {/* Navbar */}
      <motion.header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">Suraksha <span className="text-orange-500">Setu</span></span>
          </Link>
          
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
            <Link href="#how-it-works" className={`hover:text-blue-600 transition ${activeSection === 'how-it-works' ? 'text-blue-600' : ''}`}>How It Works</Link>
            <Link href="#features" className={`hover:text-blue-600 transition ${activeSection === 'features' ? 'text-blue-600' : ''}`}>Features</Link>
          </nav>
          
          <div className="flex gap-4 items-center">
            <Link href="/select-role?mode=login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
              Login
            </Link>
            <Link href="/select-role?mode=signup">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg shadow-orange-500/20 px-6 transition-all hover:scale-105 hover:-translate-y-0.5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
          {/* Subtle dark-blue radial glow behind the text for readability */}
          <div className="absolute inset-0 z-0 flex justify-center items-start pt-[15%] pointer-events-none">
            <div className="w-[600px] h-[300px] bg-[#0F284B]/15 blur-[80px] rounded-[100%]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-slate-900">Suraksha</span> <span className="text-orange-500">Setu</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl font-medium text-slate-600 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Life-Saving Response Bridge
            </motion.p>
            
            <motion.div className="flex items-center gap-2 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
               <div className="h-0.5 w-12 bg-orange-200"></div>
               <HeartPulseIcon className="text-orange-500 w-6 h-6" />
               <div className="h-0.5 w-12 bg-orange-200"></div>
            </motion.div>

            <motion.p 
              className="max-w-2xl text-lg text-slate-500 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              A secure QR-based emergency response platform that connects citizens, EMS, hospitals, police, and families during road accidents.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Link href="/select-role?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-105 hover:-translate-y-1">
                  Get Started
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-full font-bold shadow-md transition-all hover:scale-105 hover:-translate-y-1">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            {/* Floating Glass Cards */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                { icon: Lock, title: "Secure QR", desc: "Tamper-proof QR access with unique tokens.", color: "text-blue-500" },
                { icon: Activity, title: "EMS Alert", desc: "Instant patient ID and emergency alerts.", color: "text-orange-500" },
                { icon: Building2, title: "Hospital Ready", desc: "Pre-arrival alerts and ward preparation.", color: "text-green-500" },
                { icon: ShieldCheck, title: "Police Verified", desc: "Digital FIR and secure evidence logging.", color: "text-purple-500" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeInUp}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-6 flex flex-col items-center text-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div className={`w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2 shadow-sm border border-slate-100 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 relative bg-white/40 backdrop-blur-sm border-t border-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F284B] mb-4">How It Works</h2>
              <p className="text-lg text-slate-500">From accident scene to hospital care in a few simple steps</p>
            </motion.div>

            <div className="relative">
              {/* Dotted line connecting steps (hidden on mobile) */}
              <div className="hidden lg:block absolute top-12 left-[8%] right-[8%] h-0.5 border-t-2 border-dashed border-orange-200 z-0"></div>

              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {[
                  { icon: Car, title: "Citizen Generates Secure QR", desc: "Citizen creates a vehicle QR containing a secure token. No personal data in QR." },
                  { icon: AmbulanceIcon, title: "EMS Scans QR at Accident Scene", desc: "EMS scans the QR and securely retrieves critical information after authentication." },
                  { icon: Smartphone, title: "Patient Data Accessed Securely", desc: "Authorized EMS personnel access medical info, contacts & emergency details." },
                  { icon: Building2, title: "Hospital Notified & Prepared", desc: "Hospital receives the case instantly and prepares the ward & team." },
                  { icon: Map, title: "Family Gets Tracking Link", desc: "Family receives a public tracking link to monitor ambulance status in real-time." },
                  { icon: FileText, title: "Police Creates Legal Report", desc: "Police scans the QR to verify details and create a digital FIR & case report." }
                ].map((step, i) => (
                  <motion.div 
                    key={i} 
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-6">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold absolute -top-2 -left-2 z-20 shadow-md">
                        {i + 1}
                      </div>
                      <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center group-hover:border-blue-100 group-hover:shadow-blue-900/10 transition-all relative z-10 bg-gradient-to-br from-white to-slate-50">
                        <step.icon className="w-10 h-10 text-[#0F284B] group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2 px-2">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed px-1">{step.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative bg-white/60 backdrop-blur-md border-t border-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F284B] mb-4">Faster, Smarter, Safer</h2>
              <p className="text-lg text-slate-500">A unified network that eliminates delays in critical moments.</p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {[
                { title: "Secure QR Access", icon: Lock, desc: "Tamper-proof QR with unique tokens. No personal data stored in QR.", color: "text-blue-500", bg: "bg-blue-50" },
                { title: "Rapid Patient ID", icon: Users, desc: "EMS instantly retrieves medical history, allergies, and emergency contacts.", color: "text-orange-500", bg: "bg-orange-50" },
                { title: "Hospital Pre-Alert", icon: Bell, desc: "Hospitals receive live cases and prepare the trauma ward before arrival.", color: "text-red-500", bg: "bg-red-50" },
                { title: "Police Coordination", icon: FileText, desc: "Digital FIR creation and secure evidence logging with restricted medical views.", color: "text-slate-600", bg: "bg-slate-100" },
                { title: "Family-Safe Tracking", icon: MapPin, desc: "Families receive a secure link to track ambulance status in real-time.", color: "text-green-500", bg: "bg-green-50" },
                { title: "Privacy-First Data", icon: ShieldCheck, desc: "Strict role-based access ensures data is only viewed by authorized personnel.", color: "text-purple-500", bg: "bg-purple-50" }
              ].map((f, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.01 }}
                  className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex gap-5"
                >
                  <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.color} flex items-center justify-center shrink-0`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Four Pillars Section */}
        <section className="py-24 relative overflow-hidden bg-white/40 backdrop-blur-sm border-t border-white/50">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[100px] opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F284B] mb-4">One Platform, Four Pillars</h2>
              <p className="text-lg text-slate-500">Tailored command centers for every stakeholder.</p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {[
                { role: "Citizen Portal", icon: Users, desc: "Manage health profiles, register vehicles, and generate secure QR codes for your family.", bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100", btn: "bg-[#0F284B]" },
                { role: "EMS Portal", icon: AmbulanceIcon, desc: "Scan QRs at the scene, log vitals instantly, and alert the nearest hospital trauma ward.", bg: "bg-orange-50", color: "text-orange-500", border: "border-orange-100", btn: "bg-[#0F284B]" },
                { role: "Hospital Portal", icon: Building2, desc: "Receive pre-arrival alerts, prepare ICU beds, and view critical patient allergies in advance.", bg: "bg-green-50", color: "text-green-600", border: "border-green-100", btn: "bg-[#0F284B]" },
                { role: "Police Portal", icon: ShieldCheck, desc: "Verify vehicle registration securely and file digital FIRs without breaching medical privacy.", bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100", btn: "bg-[#0F284B]" }
              ].map((r, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeInUp}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
                  className={`bg-white rounded-3xl p-8 border ${r.border} shadow-lg shadow-slate-200/40 flex items-start gap-6 transition-all`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${r.bg} ${r.color} flex items-center justify-center shrink-0`}>
                    <r.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-3 ${r.color}`}>{r.role}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{r.desc}</p>
                    <Link href="/select-role?mode=signup">
                      <Button className={`${r.btn} text-white hover:opacity-90 rounded-full font-bold shadow-md transition-all hover:scale-105 hover:-translate-y-0.5`}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg py-12 border-t border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Suraksha <span className="text-orange-500">Setu</span></span>
          </div>
          <p className="text-slate-500 font-medium mb-8">Life-Saving Response Bridge</p>
          <div className="pt-8 border-t border-slate-100 w-full text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Suraksha Setu. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Custom icons to match the image precisely
function HeartPulseIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}

function AmbulanceIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 10H6" />
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2v-6l-4-5h-3v11h2" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
      <path d="M8 8v4" />
    </svg>
  );
}
