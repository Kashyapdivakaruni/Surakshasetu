"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ScanLine, Activity, Bell, LogOut, Ambulance, Building2 } from "lucide-react";

export function EMSSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Command Dashboard", href: "/ems/dashboard", icon: LayoutDashboard },
    { name: "Scan Emergency QR", href: "/ems/scan", icon: ScanLine },
    { name: "Open Cases", href: "/ems/critical-cases", icon: Activity },
    { name: "Nearby Hospitals", href: "/ems/nearby-hospitals", icon: Building2 },
    { name: "Recent Scans", href: "/ems/recent-scans", icon: ScanLine },
    { name: "Emergency Alerts", href: "/ems/notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-red-900 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Ambulance className="text-red-400" /> Suraksha
        </h2>
        <p className="text-xs text-red-300 mt-1">EMS Command Unit</p>
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
                isActive ? "bg-red-600 text-white shadow-md shadow-red-900/20" : "text-red-200 hover:bg-red-800 hover:text-white"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-red-800">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-800 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  );
}
