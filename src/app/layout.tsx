import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Helvety — Swiss Software Engineering",
  description: "Swiss Software and Apparel",
  metadataBase: new URL("https://helvety.com"),
  openGraph: {
    title: "Helvety — Swiss Software Engineering",
    description: "Swiss Software and Apparel",
    url: "https://helvety.com",
    siteName: "Helvety",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Helvety — Swiss Software Engineering",
    description: "Swiss Software and Apparel",
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
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
