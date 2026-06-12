"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ScanLine, FileText, LogOut, ShieldCheck } from "lucide-react";

export function PoliceSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Police Dashboard", href: "/police/dashboard", icon: LayoutDashboard },
    { name: "Scan Vehicle QR", href: "/police/scan", icon: ScanLine },
    { name: "Case History", href: "/police/history", icon: FileText },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-slate-400" /> Suraksha
        </h2>
        <p className="text-xs text-slate-400 mt-1">Police Control Unit</p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-slate-700 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  );
}
