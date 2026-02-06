import { ProductDetailClient } from "./product-detail-client";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/**
 * Product detail page for viewing a specific product.
 * No auth required - users can browse products without logging in.
 * Login is required only for purchasing.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductDetailClient slug={slug} />;
}
