import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import type { Metadata } from "next";

const APP_STORE_URL = "https://apps.apple.com/app/id6759716459";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ s?: string }>;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getDisplayCode(
  serialCode: string,
  shortParam?: string
): Promise<string> {
  if (shortParam) return shortParam;

  const supabase = getSupabase();
  if (!supabase) return serialCode;

  const { data } = await supabase
    .from("lighter_codes")
    .select("short_code")
    .eq("serial_code", serialCode)
    .maybeSingle();

  return data?.short_code || serialCode;
}

async function getLighterId(serialCode: string): Promise<number | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("lighter_codes")
    .select("lighter_id")
    .eq("serial_code", serialCode)
    .maybeSingle();

  if (data?.lighter_id) return data.lighter_id;

  const { data: lighter } = await supabase
    .from("lighters")
    .select("lighter_id")
    .eq("qr_code", serialCode)
    .maybeSingle();

  return lighter?.lighter_id || null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { code } = await params;
  const { s } = await searchParams;
  const displayCode = await getDisplayCode(code, s);

  return {
    title: `Flick Lighter ${displayCode} — View in App`,
    description:
      "Scan this Flick lighter QR code to add it to your collection. Download Flick to get started.",
    openGraph: {
      title: `Flick Lighter — ${displayCode}`,
      description:
        "Someone shared a Flick lighter with you. Open the app or download it to view this lighter.",
      url: `https://flick.goodmonkeys.com/l/${code}`,
      siteName: "Flick by Good Monkeys",
      type: "website",
      images: [
        {
          url: "https://flick.goodmonkeys.com/flick-icon.png",
          width: 1021,
          height: 1022,
          alt: "Flick App Icon",
        },
      ],
    },
  };
}

function AppleIcon() {
  return (
    <svg
      width="20"
      height="24"
      viewBox="0 0 814 1000"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.6-105.6-207.8-105.6-328.8 0-193.2 125.7-296 249.3-296 65.7 0 120.4 43.2 161.6 43.2 39.2 0 100.4-45.8 175.7-45.8 28.4 0 130.5 2.6 197.7 99.8zm-234.2-93.8c31.1-36.9 53-88.1 53-139.3 0-7.1-.6-14.3-1.9-20.1-50.5 1.9-110.2 33.6-146.5 75.8-26.5 29.7-54.4 81-54.4 133.1 0 7.8.6 15.6 1.3 18.2 2.6.6 6.4 1.3 10.2 1.3 45.2 0 102.4-30.3 138.3-69z" />
    </svg>
  );
}

export default async function LighterPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { s } = await searchParams;
  const displayCode = await getDisplayCode(code, s);
  const lighterId = await getLighterId(code);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[-100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-primary/2 animate-float" />
        <div className="absolute bottom-[20%] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/8 to-primary/2 animate-float [animation-delay:-5s]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/flick-icon.png"
              alt="Flick"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight">Flick</span>
          </a>
          <a
            href={APP_STORE_URL}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:-translate-y-0.5"
          >
            Download
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center relative z-10 pt-16 px-6">
        <div className="max-w-md w-full text-center py-20">
          <div className="animate-fade-up">
            <Image
              src="/flick-icon.png"
              alt="Flick"
              width={80}
              height={80}
              className="mx-auto rounded-[18px] shadow-2xl shadow-primary/20 mb-8"
            />
          </div>

          <div className="animate-fade-up-delay-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                Flick Lighter
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-up-delay-2">
            View This Lighter
            <br />
            <span className="text-primary">in the Flick App</span>
          </h1>

          <p className="text-muted mb-4 animate-fade-up-delay-2">
            Someone shared lighter <span className="text-white font-medium">{displayCode}</span> with you.
            Open it in Flick to see details, ownership history, and more.
          </p>

          <p className="text-muted/60 text-sm mb-8 animate-fade-up-delay-3">
            If you have Flick installed, the app should open automatically.
            Otherwise, download it below.
          </p>

          <div className="space-y-4 animate-fade-up-delay-4">
            {lighterId && (
              <a
                href={`rork-app://lighter/${lighterId}`}
                className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 w-full"
              >
                <span className="text-2xl">🔥</span>
                <span className="text-lg font-semibold">Open in Flick</span>
              </a>
            )}

            <a
              href={APP_STORE_URL}
              className="flex items-center justify-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10 w-full"
            >
              <AppleIcon />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wide opacity-70 leading-none">
                  Download on the
                </div>
                <div className="text-lg leading-tight font-semibold">
                  App Store
                </div>
              </div>
            </a>

            <a
              href="/"
              className="block text-sm text-muted hover:text-primary transition-colors"
            >
              Learn more about Flick →
            </a>
          </div>

          {/* Try to open the app via custom URL scheme (fallback for when Universal Links don't work) */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  localStorage.setItem('flick_pending_code', '${code.replace(/'/g, "\\'")}');
                  localStorage.setItem('flick_pending_url', window.location.href);
                } catch(e) {}
                ${lighterId ? `
                // Try opening the app via custom URL scheme
                (function() {
                  var appUrl = 'rork-app://lighter/${lighterId}';
                  var start = Date.now();
                  var iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = appUrl;
                  document.body.appendChild(iframe);
                  setTimeout(function() {
                    document.body.removeChild(iframe);
                  }, 2000);
                })();
                ` : ''}
              `,
            }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/gm-logo.png"
            alt="Good Monkeys"
            width={100}
            height={25}
            className="opacity-50 invert"
          />
          <p className="text-xs text-muted/50">
            © 2026 Good Monkeys LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
