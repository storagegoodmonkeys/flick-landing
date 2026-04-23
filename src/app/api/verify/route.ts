import { NextRequest, NextResponse } from "next/server";

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
    .brand-icon {
      width: 96px; height: 96px; border-radius: 22px;
      display: block; margin: 0 auto 24px;
      box-shadow: 0 8px 24px rgba(229,57,53,0.35);
    }
    .icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: ${success ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)"};
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 36px;
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
    <img class="brand-icon" src="https://gnzrcanlxueqffcdiykl.supabase.co/storage/v1/object/public/public-assets/email/flick-icon.png" alt="Flick!" />
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

  // All types deep-link into the app; the app itself calls verifyOtp client-side
  // so the user ends up with a real device session after tapping the email link.
  const appUrl = `${scheme}://verify?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;

  const isRecovery = type === "recovery";
  const iconEmoji = isRecovery ? "🔑" : "🔥";
  const pageTitle = isRecovery ? "Reset Password" : "Verify Email";
  const bodyCopy = isRecovery
    ? "You'll be redirected to set your new password. If the app doesn't open automatically, tap below."
    : "You'll be redirected into the Flick app to finish setting up your account. If the app doesn't open automatically, tap below.";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle} - Flick</title>
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
    .brand-icon { width: 96px; height: 96px; border-radius: 22px; display: block; margin: 0 auto 24px; box-shadow: 0 8px 24px rgba(229,57,53,0.35); }
    .icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,215,0,0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; }
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
    <img class="brand-icon" src="https://gnzrcanlxueqffcdiykl.supabase.co/storage/v1/object/public/public-assets/email/flick-icon.png" alt="Flick!" />
    <div class="icon">${iconEmoji}</div>
    <h1>Opening Flick App...</h1>
    <div class="spinner"></div>
    <p>${bodyCopy}</p>
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
