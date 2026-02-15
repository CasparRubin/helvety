"use client";

import { HelvetyPdf } from "@/components/helvety-pdf";

/**
 * Client component wrapper for the main PDF app
 * No login required - Helvety PDF is 100% free with no limits.
 */
export function PageClient(): React.JSX.Element {
  return <HelvetyPdf />;
}
