import { redirect } from "next/navigation";

import { getLoginUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

import { ProductDetailClient } from "./product-detail-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

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

  return <ProductDetailClient slug={slug} />;
}
