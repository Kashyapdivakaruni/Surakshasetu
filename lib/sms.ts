/**
 * Fast2SMS Service Layer
 * Server-side only — never import this in client components.
 * All credentials come from environment variables.
 */

export interface SmsSendResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

/**
 * Normalise an Indian mobile number to 10 digits.
 * Accepts formats like +919876543210, 919876543210, 9876543210.
 */
function normaliseIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

/**
 * Validate that a 10-digit number looks like a real Indian mobile.
 * Indian mobile numbers start with 6, 7, 8, or 9.
 */
function isValidIndianMobile(tenDigit: string): boolean {
  return /^[6-9]\d{9}$/.test(tenDigit);
}

/**
 * Send an emergency tracking SMS via Fast2SMS.
 *
 * @param rawPhone   Recipient's phone number (any common Indian format)
 * @param trackingLink  Full URL to the tracking page, e.g. https://yourapp.com/track/TOKEN
 * @param caseId     Accident case ID, used only for logging
 */
export async function sendTrackingSms(
  rawPhone: string,
  trackingLink: string,
  caseId: string
): Promise<SmsSendResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.error("[SMS] FAST2SMS_API_KEY is not configured.");
    return { success: false, error: "SMS service not configured" };
  }

  // Normalise & validate phone number
  const tenDigit = normaliseIndianPhone(rawPhone);
  if (!tenDigit || !isValidIndianMobile(tenDigit)) {
    console.error(`[SMS] Invalid phone number for case ${caseId}: "${rawPhone}"`);
    return { success: false, error: "Invalid phone number" };
  }

  const message =
    `Suraksha Setu Update: Your accident case has been registered successfully. ` +
    `Track status here: ${trackingLink}`;

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q", // quick transactional route
        message,
        language: "english",
        flash: 0,
        numbers: tenDigit,
      }),
    });

    const data = (await response.json()) as {
      return: boolean;
      request_id?: string;
      message?: string[];
    };

    if (!response.ok || !data.return) {
      const errMsg = data.message?.join(", ") ?? "Unknown Fast2SMS error";
      console.error(
        `[SMS] Fast2SMS rejected message for case ${caseId}: ${errMsg}`
      );
      return { success: false, error: errMsg };
    }

    console.log(
      `[SMS] Tracking link sent for case ${caseId} → ***${tenDigit.slice(-4)} (requestId: ${data.request_id})`
    );
    return { success: true, requestId: data.request_id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] Network/fetch error for case ${caseId}: ${message}`);
    return { success: false, error: message };
  }
}
