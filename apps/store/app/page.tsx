import { redirect } from "next/navigation";

/**
 * Root route: redirect only.
 * All users (authenticated or not) → /products.
 * Keeps / clean for future use (e.g. landing, dashboard).
 */
export default function Page() {
  redirect("/products");
}
