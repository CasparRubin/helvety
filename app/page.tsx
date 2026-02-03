import { redirect } from "next/navigation";

import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Root route: redirect only.
 * Not authenticated → auth (e.g. auth.helvety.com).
 * Authenticated → /products.
 * Keeps / clean for future use (e.g. landing, dashboard).
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  redirect("/products");
}
