import { redirect } from "next/navigation";

/**
 * Root route: redirect only (no dedicated `/` page).
 * All users (authenticated or not) → `/products`.
 * The shell-wide Light Pillar backdrop still applies via `@helvety/light-pillar`.
 */
export default function Page() {
  redirect("/products");
}
