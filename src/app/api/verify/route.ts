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

function getAppScheme(): string {
  return process.env.APP_SCHEME || "rork-app";
}

function htmlPage(
  title: string,
  message: string,
  success: boolean,
  buttonUrl: string,
  buttonText: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - Flick</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0A0A0A; color: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card { text-align: center; max-width: 400px; width: 100%; }
    .icon {
      width: 90px; height: 90px; border-radius: 50%;
      background: ${success ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)"};
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px; font-size: 44px;
    }
    .brand {
      font-size: 28px; font-weight: 800;
      background: linear-gradient(135deg, #FFD700, #FF6B35);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin-bottom: 20px;
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 15px; color: #999; line-height: 1.6; margin-bottom: 28px; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #FFD700, #FFA000);
      color: #0A0A0A; padding: 16px 40px; border-radius: 14px;
      text-decoration: none; font-weight: 700; font-size: 16px;
      width: 100%; text-align: center;
    }
    .btn:hover { opacity: 0.9; }
    .footer { margin-top: 32px; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Flick!</div>
    <div class="icon">${success ? "✅" : "⚠️"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn" href="${buttonUrl}">${buttonText}</a>
    <p class="footer">Flick — The Lighter Community</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const scheme = getAppScheme();

  console.log(
    "[verify] token_hash:",
    tokenHash ? "present" : "missing",
    "type:",
    type
  );

  // Missing params
  if (!tokenHash || !type) {
    return new NextResponse(
      htmlPage(
        "Invalid Link",
        "This verification link is invalid or incomplete. Please request a new one from the Flick app.",
        false,
        `${scheme}://`,
        "Open Flick App"
      ),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  // PASSWORD RESET — redirect to app with token
  if (type === "recovery") {
    const appUrl = `${scheme}://verify?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Password - Flick</title>
  <meta http-equiv="refresh" content="2;url=${appUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0A0A0A; color: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card { text-align: center; max-width: 400px; width: 100%; }
    .brand {
      font-size: 28px; font-weight: 800;
      background: linear-gradient(135deg, #FFD700, #FF6B35);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin-bottom: 20px;
    }
    .icon { width: 90px; height: 90px; border-radius: 50%; background: rgba(255,215,0,0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 44px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 15px; color: #999; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA000); color: #0A0A0A; padding: 16px 40px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; width: 100%; text-align: center; }
    .spinner { margin: 0 auto 20px; width: 36px; height: 36px; border: 3px solid rgba(255,215,0,0.2); border-top-color: #FFD700; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .footer { margin-top: 32px; font-size: 12px; color: #555; }
  </style>
  <script>setTimeout(function() { window.location.href = '${appUrl}'; }, 500);</script>
</head>
<body>
  <div class="card">
    <div class="brand">Flick!</div>
    <div class="icon">🔑</div>
    <h1>Opening Flick App...</h1>
    <div class="spinner"></div>
    <p>You'll be redirected to set your new password. If the app doesn't open automatically, tap below.</p>
    <a class="btn" href="${appUrl}">Open Flick App</a>
    <p class="footer">Flick — The Lighter Community</p>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // EMAIL VERIFICATION — verify OTP server-side
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email",
    });

    if (error) {
      console.error("[verify] OTP error:", error.message);
      return new NextResponse(
        htmlPage(
          "Verification Failed",
          `Could not verify your email: ${error.message}. The link may have expired. Please request a new one from the app.`,
          false,
          `${scheme}://`,
          "Open Flick App"
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    console.log("[verify] Success, user:", data.user?.id);
    return new NextResponse(
      htmlPage(
        "Email Verified!",
        "Your Flick account has been verified successfully. You can now sign in and start your lighter journey!",
        true,
        `${scheme}://`,
        "Open Flick App"
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[verify] Exception:", msg);
    return new NextResponse(
      htmlPage(
        "Something Went Wrong",
        "An unexpected error occurred. Please try again or contact support.",
        false,
        `${scheme}://`,
        "Open Flick App"
      ),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
