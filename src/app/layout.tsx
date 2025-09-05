import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
        url: "/v2509051310_100px.png",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/v2509051310_100px.png", type: "image/png", sizes: "100x100" },
      { url: "/Identifier.svg", type: "image/svg+xml" },
    ],
    apple: "/v2509051310_100px.png",
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
      </body>
    </html>
  );
}
