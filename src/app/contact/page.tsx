import type { Metadata } from "next";

export const revalidate = 60 * 60 * 24; // keep contact page cached daily

export const metadata: Metadata = {
  title: "Contact - Helvety",
  description: "Hidden contact page for Helvety",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl">Helvety by Rubin</h1>
          <p>Caspar Rubin</p>
          <p>Holeestrasse 116</p>
          <p>4054 Basel</p>
        </div>
      </div>
    </main>
  );
}


