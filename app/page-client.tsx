"use client";

import { HelvetyPdf } from "@/components/helvety-pdf";

/**
 * Client component wrapper for the main PDF app
 * Auth is checked server-side in page.tsx before this renders
 */
export function PageClient(): React.JSX.Element {
  return <HelvetyPdf />;
}
