import { redirect } from "next/navigation";

import { createServerComponentClient } from "@/lib/supabase/client-factory";

import { PageClient } from "./page-client";

/**
 * Main page - server component with auth protection
 * Redirects to login if not authenticated
 */
export default async function Page(): Promise<React.JSX.Element> {
  // Server-side auth check
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  return <PageClient />;
}
