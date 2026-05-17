import { redirect } from "next/navigation";

/**
 * Root route: redirect only (no dedicated `/` page).
 * All users (authenticated or not) → `/products`.
 */
export default function Page() {
  redirect("/products");
}
