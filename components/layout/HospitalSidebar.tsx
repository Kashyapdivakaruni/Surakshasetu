"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users, LogOut } from "lucide-react";

export function HospitalSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Emergency Ward", href: "/hospital/dashboard", icon: LayoutDashboard },
    { name: "Active Admissions", href: "/hospital/dashboard", icon: Users },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-teal-900 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="text-teal-400" /> Suraksha
        </h2>
        <p className="text-xs text-teal-300 mt-1">Hospital Care Unit</p>
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
                isActive ? "bg-teal-600 text-white shadow-md shadow-teal-900/20" : "text-teal-200 hover:bg-teal-800 hover:text-white"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-teal-800">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-300 hover:bg-teal-800 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  );
}
