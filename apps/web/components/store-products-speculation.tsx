import { getLocalAppHref, urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";

import { StoreProductsSpeculationClient } from "./store-products-speculation-client";

/**
 * Narrow Speculation Rules prefetch for the Store catalog landing.
 *
 * Mount only on the gateway homepage so visitors warm `/store/products`
 * through multi-zone rewrites without prefetching every zone. Builds the
 * rules JSON and CSP nonce on the server; the client injects the script via
 * the DOM API (avoids the React 19 script-in-component warning).
 */
export async function StoreProductsSpeculation() {
  const nonce = (await getRequestCspNonce()) ?? undefined;
  const storeProductsHref = getLocalAppHref(urls.storeProducts);
  const rulesJson = JSON.stringify({
    prefetch: [
      {
        source: "list",
        urls: [storeProductsHref],
      },
    ],
  });

  return <StoreProductsSpeculationClient rulesJson={rulesJson} nonce={nonce} />;
}
