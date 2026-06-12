"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, User, HeartPulse, Car, Users, QrCode, LogOut } from "lucide-react";

export function CitizenSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/citizen/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/citizen/profile", icon: User },
    { name: "Medical Info", href: "/citizen/medical", icon: HeartPulse },
    { name: "Vehicle Details", href: "/citizen/vehicle", icon: Car },
    { name: "Passengers", href: "/citizen/passengers", icon: Users },
    { name: "Emergency QR", href: "/citizen/qr", icon: QrCode },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-[#1A3A6B] bg-[#0F284B] text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
          <HeartPulse className="text-white" /> Suraksha
        </h2>
        <p className="text-xs text-slate-400 mt-1">Citizen Portal</p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-blue-100 hover:bg-[#1A3A6B] hover:text-white"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1A3A6B]">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200 hover:bg-[#1A3A6B] hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  );
}
