import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Send push notification to a user via Expo Push API
async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  sound: string = "flick-notification.wav"
) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound,
      priority: "high",
      title,
      body,
      data: data || {},
    }),
  });

  const result = await response.json();
  return result;
}

// POST: Send push to a specific user
// Body: { user_id: number, title: string, body: string, data?: object }
// Auth: Bearer token (must be the user themselves or service key)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Authenticate caller
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      title,
      body: pushBody,
      data: pushData,
      sound: pushSound,
    } = body;

    if (!user_id || !title || !pushBody) {
      return NextResponse.json(
        { error: "Missing user_id, title, or body" },
        { status: 400 }
      );
    }

    // Get the target user's push token + notification preferences
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select(
        "expo_push_token, full_name, notif_enabled, notif_new_messages, notif_lighter_updates, notif_badges"
      )
      .eq("user_id", user_id)
      .maybeSingle();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.expo_push_token) {
      return NextResponse.json(
        { error: "User has no push token registered" },
        { status: 400 }
      );
    }

    // Honor user's notification preferences
    // Master switch: if off, suppress everything
    if (targetUser.notif_enabled === false) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "notifications disabled by user",
      });
    }

    // Per-type filtering based on data.type. Unknown/friend types always pass.
    const notifType =
      typeof pushData === "object" && pushData !== null
        ? String((pushData as Record<string, unknown>).type ?? "")
        : "";
    const MESSAGE_TYPES = new Set(["message", "message_received"]);
    const LIGHTER_TYPES = new Set([
      "location",
      "lighter_checkin",
      "lighter_found",
      "lighter_discarded",
      "lighter_reunited",
      "transfer_request",
      "transfer_response",
      "claim_response",
    ]);
    const BADGE_TYPES = new Set(["badge", "achievement"]);

    if (MESSAGE_TYPES.has(notifType) && targetUser.notif_new_messages === false) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "new_messages disabled",
      });
    }
    if (LIGHTER_TYPES.has(notifType) && targetUser.notif_lighter_updates === false) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "lighter_updates disabled",
      });
    }
    if (BADGE_TYPES.has(notifType) && targetUser.notif_badges === false) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "badges disabled",
      });
    }

    // Send the push notification
    const result = await sendExpoPush(
      targetUser.expo_push_token,
      title,
      pushBody,
      pushData,
      typeof pushSound === "string" && pushSound.length > 0
        ? pushSound
        : "flick-notification.wav"
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-push] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
