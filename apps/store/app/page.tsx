import { redirect } from "next/navigation";

/**
 * Root route: redirect only (no dedicated `/` page).
 * All users (authenticated or not) → `/products`.
 * Shell-wide Light Pillar backdrop (md+ dark only) still applies via `@helvety/light-pillar`.
 */
export default function Page() {
  redirect("/products");
}
