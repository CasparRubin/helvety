"use client";

import { HelvetyPdf } from "@/components/helvety-pdf";

/**
 * Client component wrapper for the main PDF app
 * No login required. Helvety PDF is free with a 100MB per-file limit.
 */
export function PageClient(): React.JSX.Element {
  return <HelvetyPdf />;
}
