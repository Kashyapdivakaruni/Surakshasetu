/**
 * components/video/VideoCallButton.tsx
 *
 * Button to request a video consultation.
 *
 * Flow:
 *  1. User clicks the button.
 *  2. Sends POST /api/ems/notifications { caseId, type: "VIDEO_CALL_REQUEST" }
 *  3. Displays a dialing overlay ("Waiting for response...") with a Cancel button.
 *  4. Polls the notifications status every 3 seconds.
 *  5. On ACCEPTED: Redirects the user to the role-specific video page.
 *  6. On DISMISSED / Cancel: Cleans up overlays and shows feedback toast.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Video, PhoneOff, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export interface VideoCallButtonProps {
  caseId: string;
  /** Role of the current authenticated user */
  userRole: "EMS" | "HOSPITAL";
  /**
   * Whether a LiveKit room already exists for this case.
   * Controls only visual label or style hints.
   */
  roomExists: boolean;
  className?: string;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
}

export function VideoCallButton({
  caseId,
  userRole,
  roomExists,
  className,
  disabled = false,
  size = "default",
}: VideoCallButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [currentNotifId, setCurrentNotifId] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const targetRoleLabel = userRole === "EMS" ? "Hospital Doctor" : "EMS Paramedic";

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startPolling = (notificationId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/ems/notifications");
        if (!res.ok) return;

        const data = await res.json();
        const notification = data.notifications?.find(
          (n: any) => n.id === notificationId
        );

        if (!notification) return;

        if (notification.status === "ACCEPTED") {
          // Clear polling immediately
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsDialing(false);
          setLoading(false);

          toast({
            title: "Request Accepted",
            description: "Connecting to the consultation room...",
            type: "success",
          } as any);

          // Redirect to video consultation room
          const videoPath =
            userRole === "EMS"
              ? `/ems/video/${caseId}`
              : `/hospital/video/${caseId}`;
          router.push(videoPath);
        } else if (notification.status === "DISMISSED") {
          // Clear polling and show declined alert
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsDialing(false);
          setLoading(false);

          toast({
            title: "Request Declined",
            description: `The video consultation request was declined by the ${targetRoleLabel}.`,
            type: "error",
          } as any);
        }
      } catch (err) {
        console.error("[CallButton] Polling status failed:", err);
      }
    };

    // Poll every 3 seconds for faster emergency feedback
    pollIntervalRef.current = setInterval(checkStatus, 3000);
  };

  const handleRequestCall = async () => {
    setLoading(true);

    try {
      // Create VIDEO_CALL_REQUEST notification in PENDING status
      const res = await fetch("/api/ems/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          type: "VIDEO_CALL_REQUEST",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || "Unable to send video consultation request.";
        throw new Error(message);
      }

      const body = await res.json();
      const notificationId = body.notification?.id;

      if (!notificationId) {
        throw new Error("No request identifier returned from notifications server.");
      }

      setCurrentNotifId(notificationId);
      setIsDialing(true);
      startPolling(notificationId);
    } catch (err) {
      toast({
        title: "Call Request Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        type: "error",
      } as any);
      setLoading(false);
    }
  };

  const handleCancelCall = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setIsDialing(false);
    setLoading(false);

    if (currentNotifId) {
      try {
        // Send PATCH update to mark request as DISMISSED
        await fetch("/api/ems/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: currentNotifId,
            status: "DISMISSED",
          }),
        });
      } catch (err) {
        console.error("[CallButton] Failed to cancel request on server:", err);
      }
    }

    toast({
      title: "Call Cancelled",
      description: "You cancelled the video call request.",
      type: "info",
    } as any);
  };

  return (
    <>
      <Button
        onClick={handleRequestCall}
        disabled={disabled || loading}
        size={size}
        className={cn(
          "font-bold gap-2",
          roomExists
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          <Video className="w-4 h-4 shrink-0" />
        )}
        {loading ? "Calling…" : roomExists ? "Rejoin Video Consultation" : "Request Video Consultation"}
      </Button>

      {/* Dialer / Calling Overlay Screen */}
      {isDialing && (
        <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 overflow-hidden">
            {/* Pulsing visual ringing effect */}
            <div className="w-20 h-20 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center animate-bounce shrink-0">
              <PhoneCall className="w-9 h-9 text-indigo-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                Connecting Call...
              </h3>
              <p className="text-sm text-slate-400">
                Waiting for the <span className="font-bold text-slate-200">{targetRoleLabel}</span> to accept the emergency consultation request.
              </p>
            </div>

            {/* Cancel Call Button */}
            <Button
              onClick={handleCancelCall}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-full gap-2 mt-2"
            >
              <PhoneOff className="w-4 h-4" />
              Cancel Call
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
