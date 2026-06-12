import { HospitalSidebar } from "@/components/layout/HospitalSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideoCallRequestPoller } from "@/components/video/VideoCallRequestPoller";

export default async function HospitalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || !session?.user || session.user.role !== "HOSPITAL") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <HospitalSidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="text-sm font-medium text-slate-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
            Hospital Network Active
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
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
      <VideoCallRequestPoller userRole="HOSPITAL" userId={session.user.id} />
    </div>
  );
}
