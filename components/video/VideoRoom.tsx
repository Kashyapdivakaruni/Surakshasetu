/**
 * components/video/VideoRoom.tsx
 *
 * Full-screen video consultation component built on @livekit/components-react.
 *
 * Structure:
 *   <VideoRoom>                    ← exported, outer shell (no LiveKit hooks)
 *     <EmergencyBanner />          ← fixed header with case context + leave button
 *     <LiveKitRoom>                ← establishes WebRTC connection
 *       <VideoRoomContent>         ← inner component (uses LiveKit hooks)
 *         <VideoConference />      ← pre-built grid + controls from LiveKit
 *         <ConnectionOverlay />    ← status overlay (connecting / reconnecting / disconnected)
 *       </VideoRoomContent>
 *     </LiveKitRoom>
 *   </VideoRoom>
 *
 * The inner component pattern is required because React hooks (useConnectionState)
 * must be called inside the LiveKitRoom context provider.
 *
 * This component is "use client" — it must never be imported by a Server Component.
 */

"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import {
  AlertTriangle,
  Loader2,
  PhoneOff,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoRoomProps {
  /** Signed LiveKit participant token from GET /api/video/token */
  token: string;
  /** Public wss:// URL from NEXT_PUBLIC_LIVEKIT_URL */
  serverUrl: string;
  /** The emergency case ID — shown in the header for context */
  caseId: string;
  /** Patient name — shown in the header */
  patientName: string;
  /** Role of the current user — controls badge color */
  userRole: "EMS" | "HOSPITAL";
  /** Called when the user leaves or is disconnected — should navigate away */
  onLeave: () => void;
}

// ---------------------------------------------------------------------------
// Emergency header banner
//
// Rendered OUTSIDE <LiveKitRoom> so it never needs LiveKit hooks.
// Provides case context and a backup "Leave Call" button.
// ---------------------------------------------------------------------------

interface EmergencyBannerProps {
  caseId: string;
  patientName: string;
  userRole: "EMS" | "HOSPITAL";
  onLeave: () => void;
}

function EmergencyBanner({
  caseId,
  patientName,
  userRole,
  onLeave,
}: EmergencyBannerProps) {
  const isEms = userRole === "EMS";

  return (
    <div
      className={`flex h-14 shrink-0 items-center justify-between px-5 ${
        isEms
          ? "bg-red-950 border-b border-red-800"
          : "bg-teal-950 border-b border-teal-800"
      }`}
    >
      {/* Left: identity + live badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield
            className={`w-4 h-4 ${isEms ? "text-red-400" : "text-teal-400"}`}
          />
          <span
            className={`text-xs font-bold uppercase tracking-widest ${
              isEms ? "text-red-300" : "text-teal-300"
            }`}
          >
            {isEms ? "EMS Paramedic" : "Hospital Doctor"}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-white">LIVE</span>
        </div>
      </div>

      {/* Center: case context */}
      <div className="flex flex-col items-center">
        <p className="text-white font-extrabold text-sm leading-none">
          {patientName}
        </p>
        <p className="text-white/50 text-[10px] font-mono mt-0.5 uppercase tracking-widest">
          Case #{caseId.substring(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Right: leave button */}
      <Button
        onClick={onLeave}
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-4 h-8 gap-2 shrink-0"
      >
        <PhoneOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Leave</span>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection state overlays
//
// Rendered INSIDE <LiveKitRoom> so they can use the useConnectionState hook.
// Positioned absolutely over the video grid.
// ---------------------------------------------------------------------------

function ConnectingOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Connecting to room…</p>
          <p className="text-slate-400 text-sm mt-1">
            Establishing secure WebRTC connection
          </p>
        </div>
      </div>
    </div>
  );
}

function ReconnectingOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center animate-pulse">
          <Wifi className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Reconnecting…</p>
          <p className="text-slate-400 text-sm mt-1">
            Network disruption detected. Attempting to restore connection.
          </p>
        </div>
      </div>
    </div>
  );
}

interface DisconnectedOverlayProps {
  onLeave: () => void;
}

function DisconnectedOverlay({ onLeave }: DisconnectedOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
        <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-700 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <p className="text-white font-extrabold text-xl">
            Call Ended
          </p>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            You have left the video consultation or the connection was lost.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={onLeave}
            className="w-full bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-bold rounded-full h-11"
          >
            Return to Case
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner video content
//
// Must be a separate component so it can call useConnectionState inside the
// LiveKitRoom context provider.
// ---------------------------------------------------------------------------

interface VideoRoomContentProps {
  onLeave: () => void;
}

function VideoRoomContent({ onLeave }: VideoRoomContentProps) {
  const connectionState = useConnectionState();

  const isConnecting = connectionState === ConnectionState.Connecting;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isDisconnected = connectionState === ConnectionState.Disconnected;

  return (
    <div className="relative h-full">
      {/* LiveKit's pre-built conference UI: video grid + mic/camera/share/leave controls */}
      <VideoConference />

      {/* Connection state overlays — sit on top of the video grid */}
      {isConnecting && <ConnectingOverlay />}
      {isReconnecting && <ReconnectingOverlay />}
      {isDisconnected && <DisconnectedOverlay onLeave={onLeave} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function VideoRoom({
  token,
  serverUrl,
  caseId,
  patientName,
  userRole,
  onLeave,
}: VideoRoomProps) {
  return (
    <div
      className="flex flex-col bg-slate-950"
      style={{ height: "100dvh" }}
    >
      {/* Emergency context header — outside LiveKitRoom, no hooks needed */}
      <EmergencyBanner
        caseId={caseId}
        patientName={patientName}
        userRole={userRole}
        onLeave={onLeave}
      />

      {/*
       * LiveKit room — fills all remaining vertical space.
       * min-h-0 is required for the flex child to shrink correctly.
       * Without it, the flex child would overflow beyond 100dvh.
       */}
      <div className="flex-1 min-h-0">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          onDisconnected={onLeave}
          onError={(error) => {
            console.error("[VideoRoom] LiveKit error:", error.message);
          }}
          data-lk-theme="default"
          style={{ height: "100%" }}
        >
          <VideoRoomContent onLeave={onLeave} />
        </LiveKitRoom>
      </div>
    </div>
  );
}
