import { redirect } from "next/navigation";

import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import { TenantsClient } from "./tenants-client";

export const metadata = {
  title: "Manage Tenants",
  description: "Manage your licensed SharePoint tenants for SPO Explorer",
};

export default async function TenantsPage() {
  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to centralized auth service if not authenticated
  if (!user) {
    redirect(getLoginUrl());
  }

  return <TenantsClient />;
}
