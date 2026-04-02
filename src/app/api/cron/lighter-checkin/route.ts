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
      sound: "default",
      title,
      body,
      data: data || {},
    }),
  });
  return response.json();
}

// GET: Cron job — send "Is your lighter still with you?" to all users with a main lighter
// Protected by CRON_SECRET header
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (set CRON_SECRET in Vercel env vars)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Get all users who have a main lighter (favorite_lighters with notes='main_lighter')
    const { data: favorites, error: favError } = await supabase
      .from("favorite_lighters")
      .select(
        `
        user_id,
        lighter_id,
        users (
          expo_push_token,
          full_name
        ),
        lighters (
          nickname,
          lighter_id
        )
      `
      )
      .eq("notes", "main_lighter");

    if (favError) {
      console.error("[lighter-checkin] Error fetching favorites:", favError.message);
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No users with main lighter" });
    }

    let sent = 0;
    let skipped = 0;

    for (const fav of favorites) {
      const user = fav.users as any;
      const lighter = fav.lighters as any;

      if (!user?.expo_push_token) {
        skipped++;
        continue;
      }

      const lighterName = lighter?.nickname || `Lighter #${lighter?.lighter_id || fav.lighter_id}`;

      try {
        await sendExpoPush(
          user.expo_push_token,
          `Is "${lighterName}" still with you?`,
          "Tap to confirm and update its location.",
          {
            type: "lighter_checkin",
            lighter_id: fav.lighter_id,
          }
        );
        sent++;
      } catch (pushErr) {
        console.error(`[lighter-checkin] Failed to send to user ${fav.user_id}:`, pushErr);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, sent, skipped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[lighter-checkin] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
