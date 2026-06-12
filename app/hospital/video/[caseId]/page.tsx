"use client";

/**
 * app/hospital/video/[caseId]/page.tsx
 *
 * Doctor's video consultation room.
 *
 * Renders as a full-screen overlay (fixed inset-0 z-[100]) over the hospital
 * layout, matching the pattern used by existing modals in this codebase.
 * The existing app/hospital/layout.tsx auth guard still protects this page.
 *
 * On mount:
 *  1. Fetches the case data to resolve the patient's name (for the video header)
 *  2. Fetches a LiveKit participant token from GET /api/video/token
 *  Both fetches run in parallel via Promise.all for minimum latency.
 *
 * On leave / disconnect:
 *  Redirects back to /hospital/case/[caseId]
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/video/VideoRoom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: { caseId: string };
}

interface TokenData {
  token: string;
  serverUrl: string;
  roomName: string;
  participantName: string;
}

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

function VideoLoadingScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-teal-900/50 border border-teal-700 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl">Joining Consultation…</p>
          <p className="text-slate-400 text-sm mt-2">
            Establishing secure video connection
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-teal-300 text-xs font-bold">
          Hospital — Encrypted Channel
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error screen
// ---------------------------------------------------------------------------

interface VideoErrorScreenProps {
  message: string;
  caseId: string;
  onBack: () => void;
}

function VideoErrorScreen({ message, caseId, onBack }: VideoErrorScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-slate-950 px-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-700 flex items-center justify-center">
          <VideoOff className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <p className="text-white font-extrabold text-xl">
            Cannot Join Video Call
          </p>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Show configuration hint if env vars are not set */}
        {message.includes("not configured") && (
          <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800 rounded-xl p-4 text-left w-full">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              Add{" "}
              <code className="font-mono text-amber-200">LIVEKIT_API_KEY</code>,{" "}
              <code className="font-mono text-amber-200">LIVEKIT_API_SECRET</code>,{" "}
              <code className="font-mono text-amber-200">LIVEKIT_URL</code>, and{" "}
              <code className="font-mono text-amber-200">
                NEXT_PUBLIC_LIVEKIT_URL
              </code>{" "}
              to your .env file to enable video consultations.
            </p>
          </div>
        )}

        <Button
          onClick={onBack}
          className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white font-bold rounded-full px-8 h-11 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Case #{caseId.substring(0, 8).toUpperCase()}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HospitalVideoPage({ params }: PageProps) {
  const { caseId } = params;
  const router = useRouter();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [patientName, setPatientName] = useState<string>("Emergency Patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLeave = useCallback(() => {
    router.push(`/hospital/case/${caseId}`);
  }, [router, caseId]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        // Fetch token and case data in parallel to minimize total latency.
        // Case data is used only for the patient name in the video header.
        const [tokenRes, caseRes] = await Promise.all([
          fetch(`/api/video/token?caseId=${caseId}`),
          fetch(`/api/hospital/case/${caseId}`),
        ]);

        if (cancelled) return;

        // Token is critical — fail fast if it can't be obtained
        if (!tokenRes.ok) {
          const body = await tokenRes.json().catch(() => ({}));
          const msg =
            (body as { error?: string }).error ||
            "Failed to generate video access token.";
          throw new Error(msg);
        }

        const tokenBody = (await tokenRes.json()) as TokenData;

        // Patient name is best-effort — don't block video on it
        if (caseRes.ok) {
          const caseBody = await caseRes.json().catch(() => null);
          const name: string =
            caseBody?.emergencyCase?.citizen?.user?.fullName ||
            caseBody?.emergencyCase?.manualPatientName ||
            "Emergency Patient";
          if (!cancelled) setPatientName(name);
        }

        if (!cancelled) {
          setTokenData(tokenBody);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initialize();

    // Cleanup: if the component unmounts before fetch resolves, ignore result
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return (
    // Full-screen overlay over the hospital layout (sidebar + header hidden beneath)
    // z-[100] ensures this sits above all existing layout elements (sidebar z-auto,
    // modals z-50). Matches the fixed overlay pattern used in the existing codebase.
    <div className="fixed inset-0 z-[100] bg-slate-950">
      {loading && <VideoLoadingScreen />}

      {!loading && error && (
        <VideoErrorScreen
          message={error}
          caseId={caseId}
          onBack={handleLeave}
        />
      )}

      {!loading && !error && tokenData && (
        <VideoRoom
          token={tokenData.token}
          serverUrl={tokenData.serverUrl}
          caseId={caseId}
          patientName={patientName}
          userRole="HOSPITAL"
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
