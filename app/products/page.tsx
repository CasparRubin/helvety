import { redirect } from "next/navigation";

import { EncryptionGate } from "@/components/encryption-gate";
import { ProductsCatalog } from "@/components/products";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse software, subscriptions, and apparel from Helvety",
};

/**
 * Products catalog page.
 * Requires auth and encryption unlock.
 */
export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <main>
        <ProductsCatalog />
      </main>
    </EncryptionGate>
  );
}
