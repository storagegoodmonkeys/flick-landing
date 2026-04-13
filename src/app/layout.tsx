import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flick.goodmonkeys.com"),
  title: "Flick — Collect. Trade. Track.",
  description:
    "The social lighter collecting app. Scan, collect, and trade unique lighters with collectors worldwide.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Flick — Collect. Trade. Track.",
    description:
      "The social lighter collecting app. Scan, collect, and trade unique lighters with collectors worldwide.",
    url: "https://flick.goodmonkeys.com",
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
