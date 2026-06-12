"use client";

/**
 * Public Case Tracking Page — /track/[token]
 *
 * No login required. Access is granted by possession of the secure tracking token.
 * Does NOT display sensitive personal/medical information.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Ambulance,
  Building2,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TrackingData {
  caseId: string;
  status: string;
  severityLevel: string | null;
  accidentAddress: string | null;
  hospitalName: string | null;
  admissionStatus: string | null;
  ambulanceEtaMinutes: number | null;
  lastUpdated: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  ACTIVE: { label: "EMS On Scene", color: "bg-blue-500", icon: Activity },
  HOSPITAL_NOTIFIED: {
    label: "Hospital Notified",
    color: "bg-yellow-500",
    icon: Building2,
  },
  EN_ROUTE: {
    label: "Ambulance En Route",
    color: "bg-orange-500",
    icon: Ambulance,
  },
  ADMITTED: {
    label: "Patient Admitted",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  UNDER_TREATMENT: {
    label: "Under Treatment",
    color: "bg-purple-500",
    icon: ShieldCheck,
  },
  STABLE: { label: "Stable", color: "bg-green-600", icon: CheckCircle2 },
  CRITICAL: { label: "Critical", color: "bg-red-600", icon: AlertTriangle },
  CLOSED: { label: "Case Closed", color: "bg-slate-500", icon: ShieldCheck },
};

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "text-green-700 bg-green-100",
  MEDIUM: "text-yellow-700 bg-yellow-100",
  HIGH: "text-orange-700 bg-orange-100",
  CRITICAL: "text-red-700 bg-red-100",
};

export default function PublicTrackingPage({
  params,
}: {
  params: { token: string };
}) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/track/${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to load tracking information.");
        setTracking(null);
      } else {
        setTracking(data.tracking as TrackingData);
        setError(null);
        setLastRefresh(new Date());
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const statusCfg =
    tracking?.status && STATUS_CONFIG[tracking.status]
      ? STATUS_CONFIG[tracking.status]
      : { label: tracking?.status ?? "Unknown", color: "bg-slate-400", icon: Activity };

  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 shadow-inner">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Live Emergency Tracking
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Secure tracking link — Suraksha Setu
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <Card className="border-slate-200 shadow-md rounded-2xl">
            <CardContent className="p-10 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-500 font-medium">
                Loading tracking information…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="border-red-200 bg-red-50 shadow-md rounded-2xl">
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h2 className="font-bold text-red-900 text-lg">
                Tracking Unavailable
              </h2>
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                variant="outline"
                className="mt-2 border-red-300 text-red-700 hover:bg-red-100 rounded-full"
                onClick={fetchTracking}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tracking Info */}
        {!loading && tracking && (
          <>
            {/* Status Card */}
            <Card className="border-slate-200 shadow-lg rounded-2xl overflow-hidden">
              <div className={`${statusCfg.color} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <StatusIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                      Current Status
                    </p>
                    <h2 className="text-2xl font-extrabold">
                      {statusCfg.label}
                    </h2>
                  </div>
                  {tracking.severityLevel && (
                    <span
                      className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
                        SEVERITY_COLOR[tracking.severityLevel] ??
                        "text-slate-700 bg-white/20"
                      }`}
                    >
                      {tracking.severityLevel}
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-6 space-y-4 bg-white">
                {/* Case ID */}
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                  <span className="text-slate-500 font-medium">Case ID</span>
                  <span className="font-mono font-bold text-slate-700">
                    #{tracking.caseId.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Location */}
                {tracking.accidentAddress && (
                  <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        Accident Location
                      </p>
                      <p className="font-medium text-slate-800 text-sm">
                        {tracking.accidentAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hospital */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <Building2 className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      Assigned Hospital
                    </p>
                    <p className="font-bold text-slate-800">
                      {tracking.hospitalName ?? "Pending Assignment"}
                    </p>
                    {tracking.admissionStatus && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hospital status:{" "}
                        <span className="font-semibold text-slate-700">
                          {tracking.admissionStatus}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Admission Status */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      Admission Status
                    </p>
                    <p className="font-bold text-slate-800">
                      {tracking.admissionStatus === "ADMITTED" ||
                      tracking.status === "ADMITTED"
                        ? "✅ Patient Admitted"
                        : tracking.status === "UNDER_TREATMENT"
                        ? "🏥 Under Treatment"
                        : tracking.status === "STABLE"
                        ? "💚 Stable"
                        : "⏳ Awaiting Admission"}
                    </p>
                  </div>
                </div>

                {/* ETA */}
                {tracking.ambulanceEtaMinutes != null && (
                  <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                    <Ambulance className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        Ambulance ETA
                      </p>
                      <p className="font-bold text-orange-600 text-lg">
                        {tracking.ambulanceEtaMinutes} mins
                      </p>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last updated:{" "}
                    {new Date(tracking.lastUpdated).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={fetchTracking}
                    className="ml-auto flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
                  Response Timeline
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {[
                    {
                      done: true,
                      icon: ShieldCheck,
                      color: "bg-green-500",
                      label: "Identity Verified by EMS",
                    },
                    {
                      done: [
                        "HOSPITAL_NOTIFIED",
                        "EN_ROUTE",
                        "ADMITTED",
                        "UNDER_TREATMENT",
                        "STABLE",
                        "CRITICAL",
                        "CLOSED",
                      ].includes(tracking.status),
                      icon: Building2,
                      color: "bg-blue-500",
                      label: "Hospital Alerted & Preparing",
                    },
                    {
                      done: ["EN_ROUTE", "ADMITTED", "UNDER_TREATMENT", "STABLE", "CRITICAL", "CLOSED"].includes(
                        tracking.status
                      ),
                      icon: Ambulance,
                      color: "bg-orange-500",
                      label: "Ambulance En Route",
                    },
                    {
                      done: ["ADMITTED", "UNDER_TREATMENT", "STABLE", "CLOSED"].includes(
                        tracking.status
                      ),
                      icon: CheckCircle2,
                      color: "bg-green-600",
                      label: "Patient Admitted",
                    },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-4 group"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow shrink-0 z-10 transition-all ${
                          step.done ? step.color : "bg-slate-200"
                        } text-white`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div
                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                          step.done
                            ? "bg-green-50 border-green-200 text-green-900"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Privacy notice */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            <strong>Privacy Safe:</strong> This tracking page only shows case
            status and hospital assignment. Sensitive medical and personal
            details are not displayed here.
          </p>
        </div>

        {/* Auto-refresh note */}
        <p className="text-center text-xs text-slate-400">
          Page auto-refreshes every 15 seconds. Last check:{" "}
          {lastRefresh.toLocaleTimeString("en-IN")}
        </p>

        {/* Emergency call */}
        <Link href="tel:112" className="block w-full">
          <Button
            variant="outline"
            className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 border-none font-bold text-lg rounded-xl"
          >
            <PhoneCall className="w-5 h-5 mr-3" /> Call Emergency 112
          </Button>
        </Link>

        <div className="text-center pb-4">
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
            Powered by Suraksha Setu
          </Link>
        </div>
      </div>
    </div>
  );
}
