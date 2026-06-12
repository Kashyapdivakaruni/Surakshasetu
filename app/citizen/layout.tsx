import { CitizenSidebar } from "@/components/layout/CitizenSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  // Basic RBAC check
  if (!session || !session?.user || session.user.role !== "CITIZEN") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:bg-white print:h-auto print:block">
      <div className="print:hidden h-full">
        <CitizenSidebar />
      </div>
      <div className="flex-1 flex flex-col print:block">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm print:hidden">
          <div className="text-sm font-medium text-slate-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Suraksha Setu Secured
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              {session.user.role}
            </div>
            <div className="font-semibold text-slate-700">{session.user.email}</div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
