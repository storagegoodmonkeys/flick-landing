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
  data?: Record<string, unknown>
) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "flick-notification.wav",
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
    const { user_id, title, body: pushBody, data: pushData } = body;

    if (!user_id || !title || !pushBody) {
      return NextResponse.json(
        { error: "Missing user_id, title, or body" },
        { status: 400 }
      );
    }

    // Get the target user's push token
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("expo_push_token, full_name")
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

    // Send the push notification
    const result = await sendExpoPush(
      targetUser.expo_push_token,
      title,
      pushBody,
      pushData
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-push] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
