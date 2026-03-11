import Image from "next/image";
import Link from "next/link";

const APP_STORE_URL = "https://apps.apple.com/app/id6759716459";

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

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface/50 border border-border rounded-2xl p-6 text-center hover:border-primary/30 transition-colors duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[-100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-primary/2 animate-float" />
        <div className="absolute bottom-[20%] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/8 to-primary/2 animate-float [animation-delay:-5s]" />
        <div className="absolute top-[50%] right-[20%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary/6 to-transparent animate-float [animation-delay:-10s]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/flick-icon.png"
              alt="Flick"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight">Flick</span>
          </Link>
          <a
            href={APP_STORE_URL}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:-translate-y-0.5"
          >
            Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                Now on the App Store
              </span>
            </div>
          </div>

          <div className="animate-fade-up-delay-1">
            <Image
              src="/flick-icon.png"
              alt="Flick App Icon"
              width={100}
              height={100}
              className="mx-auto rounded-[22px] shadow-2xl shadow-primary/20 mb-8"
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up-delay-2">
            Collect. Trade.
            <br />
            <span className="text-primary">Track.</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up-delay-3">
            The social lighter collecting app. Scan QR codes, build your
            collection, trade with others, and track every lighter you own.
          </p>

          <div className="animate-fade-up-delay-4">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/10"
            >
              <AppleIcon />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wide opacity-70 leading-none">
                  Download on the
                </div>
                <div className="text-xl leading-tight font-semibold">
                  App Store
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-muted text-center mb-14 max-w-xl mx-auto">
            From scanning your first lighter to trading with collectors
            worldwide.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Feature
              icon="📸"
              title="QR Code Scanning"
              description="Every Flick lighter has a unique QR code. Scan it to instantly add it to your digital collection."
            />
            <Feature
              icon="🔥"
              title="Build Your Vault"
              description="Grow your lighter collection. Track every lighter you've ever owned in your personal vault."
            />
            <Feature
              icon="🔄"
              title="Trade & Connect"
              description="Trade lighters with other collectors. Make offers, negotiate, and expand your collection."
            />
            <Feature
              icon="🏆"
              title="Achievements"
              description="Earn badges and climb the leaderboard as your collection grows. Show off your status."
            />
            <Feature
              icon="🔍"
              title="Lost & Found"
              description="Lost a lighter? Report it. Found one? Check if someone's looking for it."
            />
            <Feature
              icon="📊"
              title="Collection Stats"
              description="See detailed stats about your collection — rarity scores, value trends, and more."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted text-center mb-14 max-w-xl mx-auto">
            Three simple steps to start your collection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Step
              number="1"
              title="Get a Flick Lighter"
              description="Purchase a lighter with a unique Flick QR code from any partner retailer."
            />
            <Step
              number="2"
              title="Scan the QR Code"
              description="Open the app and scan the code. The lighter is now registered to your collection."
            />
            <Step
              number="3"
              title="Collect & Trade"
              description="Build your vault, discover rare lighters, and trade with the community."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-surface/50 border border-border rounded-3xl p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Collecting Today
            </h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Join the community of lighter collectors. Download Flick and scan
              your first lighter.
            </p>
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20"
            >
              <AppleIcon />
              <span className="text-lg">Download on the App Store</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/gm-logo.png"
              alt="Good Monkeys"
              width={120}
              height={30}
              className="opacity-60 invert"
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a
              href="mailto:info@goodmonkeys.com"
              className="hover:text-primary transition-colors"
            >
              Contact
            </a>
            <a
              href="https://www.goodmonkeys.com"
              className="hover:text-primary transition-colors"
            >
              Good Monkeys
            </a>
          </div>
          <p className="text-xs text-muted/60">
            © 2026 Good Monkeys LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
