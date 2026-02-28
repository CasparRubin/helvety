"use client";

import { HelvetyPdf } from "@/components/helvety-pdf";

/**
 * Client component wrapper for the main PDF app
 * No login required. As of February 28, 2026, Helvety PDF is available at no
 * cost with a 100MB per-file limit.
 */
export function PageClient(): React.JSX.Element {
  return <HelvetyPdf />;
}
