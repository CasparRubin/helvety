import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
