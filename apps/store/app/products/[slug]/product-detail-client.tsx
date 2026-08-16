"use client";

/**
 * Product detail client component.
 * Displays full product information with free actions: Chrome Web Store install
 * links where configured, Store-hosted package downloads, or app deep links.
 * The server page calls `notFound()` when the slug is absent from
 * `@helvety/shared/store-catalog`; this client guard covers rare
 * catalog vs `products.ts` drift. Package downloads use a click-only button
 * (no `<a href>` to the download API) to avoid prefetch.
 */

import { Button } from "@helvety/ui/button";
import { Separator } from "@helvety/ui/separator";
import { ArrowLeft, Check, Code2, Download, ExternalLink } from "lucide-react";
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
  const chromeWebStoreUrl = product.links?.chromeWebStore;
  const softwareModules =
    isSoftwareProduct(product) && product.software.modules?.length
      ? product.software.modules.map((module) => ({
          ...module,
          downloadUrl: `/store/api/packages/${module.publicPackageId}/download`,
        }))
      : [];

  const showDownload = Boolean(packageDownloadUrl && downloadFormat);
  const showAppLink = Boolean(appUrl);
  const showChromeWebStore = Boolean(chromeWebStoreUrl);

  return (
    <div className="mx-auto max-w-6xl px-0 py-6 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/products" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to Products</span>
        </Button>
      </div>

      <ProductDetailHero product={product} />

      {/* Two-column layout: long-form copy + Access / Features sidebar */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_min(100%,380px)] lg:gap-14 xl:grid-cols-[1fr_400px]">
        {/* Main content */}
        <div className="min-w-0 space-y-10">
          <section
            id="about"
            className="bg-surface-panel ring-foreground/5 rounded-2xl border p-6 shadow-sm sm:p-8"
          >
            <h2 className="mb-4 text-xl font-semibold tracking-tight">About</h2>
            <div className="max-w-none space-y-6">
              <p className="text-muted-foreground text-base leading-relaxed text-pretty">
                {product.description.intro}
              </p>
              {product.description.sections?.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-foreground mb-2 text-base font-semibold tracking-tight">
                    {section.heading}
                  </h3>
                  {section.kind === "paragraph" ? (
                    <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base">
                      {section.body}
                    </p>
                  ) : (
                    <ul className="text-muted-foreground mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed sm:text-base">
                      {section.items.map((item) => (
                        <li key={item} className="text-pretty">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {softwareModules.length > 0 && (
            <section
              id="modules"
              className="bg-surface-panel ring-foreground/5 rounded-2xl border p-6 shadow-sm sm:p-8"
            >
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                Modules
              </h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed text-pretty sm:text-base">
                Drop-in modules live in the app modules folder. Download a ZIP,
                extract it, and copy the module folder there. In the app, use
                Open modules folder.
              </p>
              <ul className="space-y-5">
                {softwareModules.map((module) => (
                  <li
                    key={module.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-foreground text-base font-semibold tracking-tight">
                        {module.name}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed text-pretty">
                        {module.description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() => {
                        window.location.assign(module.downloadUrl);
                      }}
                    >
                      <Download className="size-4 shrink-0" />
                      Download {module.name} .{module.fileFormat}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {installationSteps && (
            <section className="bg-surface-panel ring-foreground/5 rounded-2xl border p-6 shadow-sm sm:p-8">
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
                Current Helvety products in this catalog are free to use with no
                paid tiers or subscriptions.
              </p>
              <div className="flex flex-col gap-2">
                {showChromeWebStore && chromeWebStoreUrl && (
                  <Button
                    className="w-full"
                    render={
                      <a
                        href={chromeWebStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Add to Chrome
                  </Button>
                )}
                {showDownload && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (packageDownloadUrl) {
                        window.location.assign(packageDownloadUrl);
                      }
                    }}
                  >
                    <Download className="size-4 shrink-0" />
                    Download .{downloadFormat}
                  </Button>
                )}
                {showAppLink && appUrl && (
                  <Button
                    className="w-full"
                    render={
                      <a
                        href={appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Go to App
                  </Button>
                )}
                {githubUrl && (
                  <Button
                    className="w-full"
                    variant="outline"
                    render={
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    <Code2 className="size-4 shrink-0" />
                    View source code on GitHub
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
