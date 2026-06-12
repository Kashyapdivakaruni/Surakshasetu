import { PoliceSidebar } from "@/components/layout/PoliceSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PoliceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || !session?.user || session.user.role !== "POLICE") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="text-sm font-medium text-slate-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>
            Police Coordination Active
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded-full">
              {session.user.role}
            </div>
            <div className="font-semibold text-slate-700">{session.user.email}</div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
