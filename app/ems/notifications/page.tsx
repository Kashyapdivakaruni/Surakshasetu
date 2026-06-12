"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Copy, ExternalLink, CheckCircle2, Phone, Building2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function EmergencyNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/ems/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Link copied to clipboard", type: "success" });
  };

  const getIcon = (type: string) => {
    if (type.includes("HOSPITAL")) return <Building2 className="w-5 h-5 text-indigo-500" />;
    if (type.includes("CONTACT")) return <Phone className="w-5 h-5 text-green-500" />;
    if (type.includes("POLICE")) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-blue-500" />;
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading notifications...</div>;

  return (
    <div className="space-y-6 font-sans pb-10 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B] flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-600" /> Emergency Notifications
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Log of all automated alerts dispatched during emergency responses.</p>
      </div>

      {notifications.length === 0 ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="bg-green-50 p-6 rounded-full mb-4 border border-green-100">
            <Activity className="w-12 h-12 text-green-500" />
          </div>
          <p className="font-bold text-xl text-[#0F284B]">No notifications dispatched yet.</p>
          <p className="text-sm mt-2 text-slate-500 max-w-md">Alerts will appear here when you create a case or assign a hospital.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-slate-50 rounded-full border border-slate-100">
                        {getIcon(notif.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-600">
                            {notif.type.replace("_", " ")}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center ${notif.status === 'SENT' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                            {notif.status === 'SENT' && <CheckCircle2 className="w-3 h-3 mr-1" />} {notif.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#0F284B] text-lg mt-1">To: {notif.recipientName} ({notif.recipientPhone})</h3>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                      <p className="text-sm text-slate-700 font-medium">"{notif.message}"</p>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 font-bold">
                      {new Date(notif.createdAt).toLocaleString()} {notif.caseId && `• Case #${notif.caseId.substring(0,8).toUpperCase()}`}
                    </div>
                  </div>
                  {notif.trackingLink && (
                    <div className="bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 p-5 flex flex-col justify-center gap-2 shrink-0 sm:w-48">
                      <Button variant="outline" onClick={() => copyToClipboard(notif.trackingLink)} className="w-full text-xs font-bold rounded-full h-9">
                        <Copy className="w-3 h-3 mr-2" /> Copy Link
                      </Button>
                      <Link href={notif.trackingLink} target="_blank">
                        <Button className="w-full text-xs font-bold rounded-full h-9 bg-[#0F284B] hover:bg-[#1A3A6B] text-white">
                          <ExternalLink className="w-3 h-3 mr-2" /> Open Tracking
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
