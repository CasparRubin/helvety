"use client";

import { RootGlobalError } from "@helvety/ui/root-global-error";

/** Global error boundary for the Docs app. */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RootGlobalError {...props} />;
}
