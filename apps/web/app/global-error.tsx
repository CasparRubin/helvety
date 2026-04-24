"use client";

import { RootGlobalError } from "@helvety/ui/root-global-error";

/** Root layout error boundary (delegates to `@helvety/ui/root-global-error`). */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RootGlobalError {...props} />;
}
