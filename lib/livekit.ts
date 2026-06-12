/**
 * lib/livekit.ts
 *
 * Server-side LiveKit helper library.
 *
 * Responsibilities:
 *  - Environment variable validation
 *  - Room creation (idempotent)
 *  - Room lookup
 *  - Participant token generation
 *
 * IMPORTANT: This file must only be imported in Server Components or
 * API Route Handlers. Never import it in a "use client" module.
 * LIVEKIT_API_KEY and LIVEKIT_API_SECRET must never reach the browser.
 */

import {
  AccessToken,
  RoomServiceClient,
  type CreateOptions,
  type Room,
} from "livekit-server-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveKitConfig {
  apiKey: string;
  apiSecret: string;
  wsUrl: string;
}

export interface GenerateTokenOptions {
  /** LiveKit room name — e.g. "ss-case-abc12345" */
  roomName: string;
  /** Unique identity for this participant — use the user's database ID */
  participantIdentity: string;
  /** Display name shown to other participants */
  participantName: string;
  /** Whether this participant may publish audio/video tracks */
  canPublish?: boolean;
  /** Whether this participant may subscribe to others' tracks */
  canSubscribe?: boolean;
  /** Token lifetime in seconds. Default: 7200 (2 hours) */
  ttlSeconds?: number;
}

export interface TokenResult {
  token: string;
  /** The public WebSocket URL for the client to connect to */
  serverUrl: string;
}

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

/**
 * Reads and validates the required LiveKit environment variables.
 * Throws a descriptive error on the server if any variable is missing,
 * which prevents silent failures in production.
 */
function getLiveKitConfig(): LiveKitConfig {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "[LiveKit] LIVEKIT_API_KEY is not set. Add it to your .env file."
    );
  }
  if (!apiSecret || apiSecret.trim() === "") {
    throw new Error(
      "[LiveKit] LIVEKIT_API_SECRET is not set. Add it to your .env file."
    );
  }
  if (!wsUrl || wsUrl.trim() === "") {
    throw new Error(
      "[LiveKit] LIVEKIT_URL is not set. Add it to your .env file."
    );
  }

  return { apiKey, apiSecret, wsUrl };
}

/**
 * Returns the public WebSocket URL that the browser uses to connect.
 * Uses NEXT_PUBLIC_LIVEKIT_URL so it can be safely included in API responses.
 * Falls back to LIVEKIT_URL if the public var is not set.
 */
export function getLiveKitPublicUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const serverUrl = process.env.LIVEKIT_URL;
  const url = publicUrl || serverUrl;

  if (!url || url.trim() === "") {
    throw new Error(
      "[LiveKit] Neither NEXT_PUBLIC_LIVEKIT_URL nor LIVEKIT_URL is set."
    );
  }

  return url;
}

// ---------------------------------------------------------------------------
// Room Service client (singleton per process)
// ---------------------------------------------------------------------------

let _roomServiceClient: RoomServiceClient | null = null;

/**
 * Returns a singleton RoomServiceClient instance.
 * The client is created lazily on first use so that import-time errors
 * (missing env vars) only surface when a LiveKit function is actually called.
 */
function getRoomServiceClient(): RoomServiceClient {
  if (_roomServiceClient) return _roomServiceClient;

  const { apiKey, apiSecret, wsUrl } = getLiveKitConfig();
  _roomServiceClient = new RoomServiceClient(wsUrl, apiKey, apiSecret);
  return _roomServiceClient;
}

// ---------------------------------------------------------------------------
// Room name convention
// ---------------------------------------------------------------------------

/**
 * Derives a deterministic LiveKit room name from a case ID.
 *
 * Convention: "ss-case-{first 12 characters of caseId}"
 * Example:    "ss-case-cm2x8yz1abc0"
 *
 * Keeping it short and prefixed avoids collisions with other LiveKit projects
 * that may share the same API key.
 */
export function getRoomNameForCase(caseId: string): string {
  // LiveKit room names may only contain: letters, digits, hyphens, underscores, dots
  // cuid() IDs from Prisma are safe (letters + digits)
  return `ss-case-${caseId.substring(0, 12)}`;
}

// ---------------------------------------------------------------------------
// Room creation (idempotent)
// ---------------------------------------------------------------------------

/**
 * Creates a LiveKit room for the given case.
 *
 * Idempotency: LiveKit's createRoom is itself idempotent — if a room with
 * the same name already exists, the server returns the existing room without
 * creating a duplicate. This means calling createLiveKitRoom multiple times
 * for the same caseId is always safe.
 *
 * Configuration:
 *  - maxParticipants: 2 (one doctor, one paramedic)
 *  - emptyTimeout: 720 seconds (12 minutes) — room is kept alive for
 *    reconnection after both participants disconnect
 */
export async function createLiveKitRoom(caseId: string): Promise<Room> {
  const client = getRoomServiceClient();
  const roomName = getRoomNameForCase(caseId);

  const options: CreateOptions = {
    name: roomName,
    // Keep the room alive for 12 minutes after the last participant leaves.
    // This allows either party to reconnect within the window.
    emptyTimeout: 720,
    // Hard cap: 1 doctor + 1 paramedic
    maxParticipants: 2,
    // Metadata carries the caseId so any LiveKit webhook handler can
    // correlate events back to the database without parsing room names.
    metadata: JSON.stringify({ caseId }),
  };

  const room = await client.createRoom(options);
  return room;
}

// ---------------------------------------------------------------------------
// Room lookup
// ---------------------------------------------------------------------------

/**
 * Checks whether a LiveKit room for this case currently exists on the server.
 *
 * Returns the Room object if found, or null if the room does not exist or
 * has already been cleaned up.
 */
export async function getLiveKitRoom(caseId: string): Promise<Room | null> {
  const client = getRoomServiceClient();
  const roomName = getRoomNameForCase(caseId);

  try {
    const rooms = await client.listRooms([roomName]);
    if (rooms.length === 0) return null;
    return rooms[0];
  } catch {
    // listRooms throws if the room doesn't exist in some SDK versions
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token generation
// ---------------------------------------------------------------------------

/**
 * Generates a short-lived participant access token for a LiveKit room.
 *
 * Security properties:
 *  - Signed with LIVEKIT_API_SECRET — only valid for your LiveKit project
 *  - Contains participant identity — server can audit who joined
 *  - Contains explicit grants — limits what the participant can do
 *  - TTL default: 2 hours (ample for an emergency consultation)
 *
 * The returned token is safe to send to the client. It does NOT expose
 * LIVEKIT_API_KEY or LIVEKIT_API_SECRET.
 */
export async function generateLiveKitToken(
  options: GenerateTokenOptions
): Promise<TokenResult> {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const {
    roomName,
    participantIdentity,
    participantName,
    canPublish = true,
    canSubscribe = true,
    ttlSeconds = 7200,
  } = options;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    // ttl must be expressed as a duration string understood by livekit-server-sdk
    ttl: ttlSeconds,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    // Allow the participant to publish their own data messages
    // (used for in-room chat or signalling if needed in future)
    canPublishData: true,
  });

  const token = await at.toJwt();
  const serverUrl = getLiveKitPublicUrl();

  return { token, serverUrl };
}
