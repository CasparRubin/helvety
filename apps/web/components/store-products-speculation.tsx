import { getLocalAppHref, urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";

/**
 * Narrow Speculation Rules prefetch for the Store catalog landing.
 *
 * Mount only on the gateway homepage so visitors warm `/store/products`
 * through multi-zone rewrites without prefetching every zone. Uses the
 * request CSP nonce so `script-src` allows the inline speculationrules JSON.
 * `suppressHydrationWarning` matches {@link JsonLdScript}: browsers empty the
 * nonce attribute after applying CSP, which would otherwise warn on hydrate.
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
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: speculationRules }}
    />
  );
}
