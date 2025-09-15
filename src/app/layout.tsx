import type { Metadata } from "next";
import { Geist, Lexend, Jost } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
  description: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
  metadataBase: new URL("https://helvety.com"),
  openGraph: {
    title: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
    description: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
    url: "https://helvety.com",
    siteName: "Helvety",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
    description: "Helvety - Software and Apparel - Developed and Designed in Switzerland",
    images: [
      {
        url: "/Identifier_whiteBg.png",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/Identifier_whiteBg.png", type: "image/png" },
      { url: "/Identifier_whiteBg.svg", type: "image/svg+xml" },
    ],
    apple: "/Identifier_whiteBg.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} ${lexend.variable} ${geistSans.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
