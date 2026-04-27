"use client";

/**
 * Product detail client component
 * Displays full product information with free download/app actions
 */

import { Button } from "@helvety/ui/button";
import { Separator } from "@helvety/ui/separator";
import { ArrowLeft, Check, Download, ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FeatureList } from "@/components/products/feature-list";
import { ProductDetailHero } from "@/components/products/product-detail-hero";
import { getProductBySlug } from "@/lib/data/products";
import { isSaaSProduct, isSoftwareProduct } from "@/lib/types/products";

/** Props for the product detail page client component. */
interface ProductDetailClientProps {
  slug: string;
}

/** Renders the full product detail page with access details and features. */
export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const appUrl = isSaaSProduct(product)
    ? product.saas?.appUrl
    : product.links?.website;
  const publicPackageId =
    isSoftwareProduct(product) && product.software.publicPackageId
      ? product.software.publicPackageId
      : null;
  const packageDownloadUrl = publicPackageId
    ? `/store/api/packages/${publicPackageId}/download`
    : null;
  const downloadFormat =
    isSoftwareProduct(product) && product.software.fileFormat
      ? product.software.fileFormat
      : null;
  const installationSteps =
    isSoftwareProduct(product) && product.software.installationSteps?.length
      ? product.software.installationSteps
      : null;
  const githubUrl = product.links?.github;

  const showDownload = Boolean(packageDownloadUrl && downloadFormat);
  const showAppLink = Boolean(appUrl);

  return (
    <div className="mx-auto max-w-6xl px-0 py-6 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Products</span>
          </Link>
        </Button>
      </div>

      <ProductDetailHero product={product} />

      {/* Two-column layout: long-form copy + Access / Features sidebar */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_min(100%,380px)] lg:gap-14 xl:grid-cols-[1fr_400px]">
        {/* Main content */}
        <div className="min-w-0 space-y-10">
          <section
            id="about"
            className="bg-surface-panel/40 ring-foreground/5 rounded-2xl p-6 ring-1 sm:p-8"
          >
            <h2 className="mb-4 text-xl font-semibold tracking-tight">About</h2>
            <div className="prose prose-neutral dark:prose-invert prose-p:text-muted-foreground prose-p:whitespace-pre-line max-w-none">
              {product.description.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          {installationSteps && (
            <section className="bg-surface-panel/40 ring-foreground/5 rounded-2xl p-6 ring-1 sm:p-8">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                Installation
              </h2>
              <ol className="text-muted-foreground list-decimal space-y-6 pl-5 text-sm leading-relaxed">
                {installationSteps.map((step) => (
                  <li key={step.title} className="pl-1">
                    <span className="text-foreground font-medium">
                      {step.title}
                    </span>
                    <p className="mt-2">{step.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Sidebar: Access, Features, Requirements */}
        <div className="min-w-0 space-y-6 lg:pt-1">
          <div className="bg-surface-panel ring-foreground/5 sticky top-28 z-10 space-y-6 rounded-2xl border p-6 shadow-sm lg:top-32">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Access</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                All Helvety products are free to use with no paid tiers or
                subscriptions.
              </p>
              <div className="flex flex-col gap-2">
                {showDownload && packageDownloadUrl && downloadFormat && (
                  <Button className="w-full" asChild>
                    <a href={packageDownloadUrl}>
                      <Download className="size-4 shrink-0" />
                      Download .{downloadFormat}
                    </a>
                  </Button>
                )}
                {showAppLink && appUrl && (
                  <Button className="w-full" asChild>
                    <a href={appUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4 shrink-0" />
                      Go to App
                    </a>
                  </Button>
                )}
                {githubUrl && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="size-4 shrink-0" />
                      View source code on GitHub
                    </a>
                  </Button>
                )}
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4 text-lg font-semibold">Features</h2>
              <FeatureList features={product.features} />
            </section>

            {isSoftwareProduct(product) && product.software?.requirements && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Requirements</h2>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    {product.software.requirements.map((req: string) => (
                      <li key={req} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
