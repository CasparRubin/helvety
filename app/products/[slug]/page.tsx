import { redirect } from "next/navigation";

import { EncryptionGate } from "@/components/encryption-gate";
import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import { ProductDetailClient } from "./product-detail-client";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/**
 * Product detail page for viewing a specific product.
 * Requires auth and encryption unlock.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to centralized auth service if not authenticated
  if (!user) {
    redirect(getLoginUrl());
  }

  const { slug } = await params;

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <ProductDetailClient slug={slug} />
    </EncryptionGate>
  );
}
