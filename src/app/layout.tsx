import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flick — Collect. Trade. Track.",
  description:
    "The social lighter collecting app. Scan, collect, and trade unique lighters with collectors worldwide.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Flick — Collect. Trade. Track.",
    description:
      "The social lighter collecting app. Scan, collect, and trade unique lighters with collectors worldwide.",
    url: "https://flick.goodmonkeys.com",
    siteName: "Flick by Good Monkeys",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
