import { notFound } from "next/navigation";

/**
 * Sentinel product route used by `proxy.ts` for unknown slugs so the branded
 * 404 renders with a real 404 status before streaming starts.
 */
export default function ProductNotFoundPage(): never {
  notFound();
}
