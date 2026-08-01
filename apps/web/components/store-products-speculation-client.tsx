"use client";

import { useEffect } from "react";

const MARKER = "data-helvety-store-products-speculation";

/**
 * Injects Speculation Rules via the DOM API so React 19 does not warn and
 * Chrome honors the rules (React host `<script type="speculationrules">` is ignored).
 */
export function StoreProductsSpeculationClient({
  rulesJson,
  nonce,
}: Readonly<{
  rulesJson: string;
  nonce?: string;
}>) {
  useEffect(() => {
    if (
      typeof HTMLScriptElement !== "undefined" &&
      typeof HTMLScriptElement.supports === "function" &&
      !HTMLScriptElement.supports("speculationrules")
    ) {
      return;
    }

    if (document.querySelector(`script[type="speculationrules"][${MARKER}]`)) {
      return;
    }

    const el = document.createElement("script");
    el.type = "speculationrules";
    el.setAttribute(MARKER, "");
    if (nonce) {
      el.nonce = nonce;
    }
    el.textContent = rulesJson;
    document.head.append(el);
    return () => {
      el.remove();
    };
  }, [rulesJson, nonce]);

  return null;
}
