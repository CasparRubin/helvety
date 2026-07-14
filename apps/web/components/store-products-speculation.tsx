import { getLocalAppHref, urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";

/**
 * Narrow Speculation Rules prefetch for the Store catalog landing.
 *
 * Mount only on the gateway homepage so visitors warm `/store/products`
 * through multi-zone rewrites without prefetching every zone. Uses the
 * request CSP nonce so `script-src` allows the inline speculationrules JSON.
 */
export async function StoreProductsSpeculation() {
  const nonce = (await getRequestCspNonce()) ?? undefined;
  const storeProductsHref = getLocalAppHref(urls.storeProducts);
  const speculationRules = JSON.stringify({
    prefetch: [
      {
        source: "list",
        urls: [storeProductsHref],
      },
    ],
  });

  return (
    <script
      type="speculationrules"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: speculationRules }}
    />
  );
}
