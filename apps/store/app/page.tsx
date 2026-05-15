import { redirect } from "next/navigation";

/**
 * Root route: redirect only (no dedicated `/` page).
 * All users (authenticated or not) → `/products`.
 * The shell-wide Light Pillar backdrop still applies via {@link ../components/store-shell-with-backdrop.tsx}.
 */
export default function Page() {
  redirect("/products");
}
