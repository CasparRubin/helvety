import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { DownloadsClient } from "./downloads-client";

export const metadata = {
  title: "Downloads",
  description: "Download your licensed software packages",
};

export default async function DownloadsPage() {
  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  return <DownloadsClient />;
}
