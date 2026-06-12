/**
 * Tracking Token Service
 * Generates cryptographically random tokens for accident case tracking URLs.
 * Server-side only.
 */

import { randomBytes } from "crypto";

/** Token length in bytes → 32 bytes = 64 hex chars, hard to guess */
const TOKEN_BYTES = 32;

/**
 * Generate a new unique tracking token.
 * Returns a 64-character lowercase hexadecimal string.
 */
export function generateTrackingToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Build the full public tracking URL for a given token.
 * Uses APP_URL env var; falls back to localhost for local dev.
 */
export function buildTrackingUrl(trackingToken: string): string {
  const base =
    process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/track/${trackingToken}`;
}
