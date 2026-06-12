/**
 * components/video/VideoCallRequestPoller.tsx
 *
 * Client-side component mounted in global layouts that polls targeted
 * notifications every 5 seconds. Shows a high-priority fullscreen emergency
 * modal when an incoming PENDING video call request is detected.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Video, PhoneOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface VideoCallRequestPollerProps {
  userRole: "EMS" | "HOSPITAL";
  userId: string;
}

interface Notification {
  id: string;
  caseId: string | null;
  type: string;
  message: string;
  status: string;
  senderRole: string | null;
  createdAt: string;
}

export function VideoCallRequestPoller({
  userRole,
  userId,
}: VideoCallRequestPollerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activeRequest, setActiveRequest] = useState<Notification | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/ems/notifications");
        if (!res.ok) return;

        const data = await res.json();
        if (!active) return;

        // Find the first PENDING video call request targeted to us
        const pendingRequest = data.notifications?.find(
          (n: Notification) =>
            n.type === "VIDEO_CALL_REQUEST" && n.status === "PENDING"
        );

        if (pendingRequest) {
          setActiveRequest(pendingRequest);
        } else {
          setActiveRequest(null);
        }
      } catch (err) {
        console.error("[Poller] Notifications poll failed:", err);
      }
    };

    // Initial check
    poll();

    // Poll every 5 seconds
    const interval = setInterval(poll, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId]);

  const handleAction = async (status: "ACCEPTED" | "DISMISSED") => {
    if (!activeRequest) return;

    setActing(true);
    try {
      const res = await fetch("/api/ems/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: activeRequest.id,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification request status.");
      }

      toast({
        title: status === "ACCEPTED" ? "Call Accepted" : "Call Dismissed",
        description:
          status === "ACCEPTED"
            ? "Connecting to video consultation room..."
            : "Emergency request dismissed.",
        type: "success",
      } as any);

      // Clean up the modal state immediately
      const caseId = activeRequest.caseId;
      setActiveRequest(null);

      // Redirect if accepted
      if (status === "ACCEPTED" && caseId) {
        const path =
          userRole === "EMS"
            ? `/ems/video/${caseId}`
            : `/hospital/video/${caseId}`;
        router.push(path);
      }
    } catch (err) {
      toast({
        title: "Action Failed",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        type: "error",
      } as any);
    } finally {
      setActing(false);
    }
  };

  if (!activeRequest) return null;

  const senderLabel =
    activeRequest.senderRole === "EMS" ? "EMS Paramedic" : "Hospital Doctor";

  return (
    <div className="fixed inset-0 z-[150] bg-red-950/95 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-red-600 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Emergency Alert Header Icon */}
        <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center animate-pulse shrink-0">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-wide text-red-500 uppercase">
            HIGH ALERT Video Request
          </h2>
          <p className="text-slate-300 font-semibold text-sm">
            Incoming consultation from: <span className="text-white font-extrabold">{senderLabel}</span>
          </p>
        </div>

        {/* Message Panel */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 w-full text-left font-sans italic text-sm text-slate-200 leading-relaxed shadow-inner">
          "{activeRequest.message}"
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
          <Button
            onClick={() => handleAction("ACCEPTED")}
            disabled={acting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black text-base h-14 rounded-full shadow-lg gap-2"
          >
            {acting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            Accept Call
          </Button>

          <Button
            onClick={() => handleAction("DISMISSED")}
            disabled={acting}
            variant="outline"
            className="flex-1 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white font-black text-base h-14 rounded-full gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Dismiss
          </Button>
        </div>

        {/* Case Footer Context */}
        {activeRequest.caseId && (
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-2">
            Case #{activeRequest.caseId.substring(0, 8).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
