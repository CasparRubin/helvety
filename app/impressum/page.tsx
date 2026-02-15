import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | Helvety",
  description: "Impressum for Helvety - Software and Subscriptions",
  alternates: {
    canonical: "https://helvety.com/impressum",
  },
};

/** Legal notice / Impressum page for Helvety */
export default function ImpressumPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <article className="space-y-10">
          <header>
            <h1 className="mb-2 text-3xl font-bold">Impressum</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: February 14, 2026
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Impressum gemäss Art. 3 Abs. 1 lit. s UWG / Legal Notice pursuant
              to Swiss Unfair Competition Act
            </p>
          </header>

          {/* Company Information */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Company Information</h2>
            <div className="border-border bg-card space-y-4 border p-6 text-sm">
              <div>
                <p className="text-foreground font-medium">Helvety by Rubin</p>
                <p className="text-muted-foreground">
                  Einzelfirma (Sole Proprietorship)
                </p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">Owner</p>
                <p className="text-muted-foreground">
                  <a
                    href="https://casparrubin.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    Caspar Camille Rubin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">Address</p>
                <p className="text-muted-foreground">Holeestrasse 116</p>
                <p className="text-muted-foreground">4054 Basel</p>
                <p className="text-muted-foreground">Switzerland</p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">Contact</p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <a
                    href="mailto:contact@helvety.com"
                    className="hover:text-foreground underline transition-colors"
                  >
                    contact@helvety.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Phone:{" "}
                  <a
                    href="tel:+41798700208"
                    className="hover:text-foreground underline transition-colors"
                  >
                    +41 79 870 02 08
                  </a>
                </p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">Registration</p>
                <p className="text-muted-foreground">
                  Registered in the Commercial Register of Basel-Stadt
                </p>
                <p className="text-muted-foreground">UID: CHE-356.266.592</p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  Responsible for Content
                </p>
                <p className="text-muted-foreground">
                  Caspar Camille Rubin (Verantwortlich f&uuml;r den Inhalt)
                </p>
              </div>
            </div>
          </section>

          {/* Business Activity */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Business Activity</h2>
            <p className="text-muted-foreground text-sm">
              Helvety by Rubin develops and sells software and
              software-as-a-service (SaaS) subscriptions. Physical products
              (such as apparel) are planned for the future. All products are
              designed and developed in Switzerland.
            </p>
          </section>

          {/* Trademark */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Trademark</h2>
            <p className="text-muted-foreground text-sm">
              The Helvety name is a registered word mark (Wortmarke) of Helvety
              by Rubin. All rights reserved.
            </p>
          </section>

          {/* Abuse Reporting */}
          <section id="abuse">
            <h2 className="mb-4 text-xl font-semibold">Abuse Reporting</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              If you believe that our Services are being used for illegal
              activity, or if you are a law enforcement authority with a legal
              request, please contact us:
            </p>
            <div className="border-border bg-card space-y-4 border p-6 text-sm">
              <div>
                <p className="text-foreground mb-1 font-medium">
                  Contact for Abuse Reports
                </p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <a
                    href="mailto:contact@helvety.com"
                    className="hover:text-foreground underline transition-colors"
                  >
                    contact@helvety.com
                  </a>
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 font-medium">
                  What to Include in a Report
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1">
                  <li>
                    Description of the suspected illegal activity or content
                  </li>
                  <li>
                    Any account identifiers you may have (e.g., email address)
                  </li>
                  <li>Your contact information for follow-up</li>
                  <li>Reference to the applicable legal basis (if known)</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground mb-1 font-medium">
                  For Law Enforcement
                </p>
                <p className="text-muted-foreground">
                  Legal requests must be issued in accordance with applicable
                  Swiss law. We respond to valid Swiss court orders and binding
                  legal requests. Due to our zero-knowledge, end-to-end
                  encryption architecture, we can only provide non-encrypted
                  metadata (account information, IP addresses, timestamps,
                  storage usage). We cannot decrypt user content.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 font-medium">
                  Response Commitment
                </p>
                <p className="text-muted-foreground">
                  We acknowledge abuse reports within 48 hours on business days.
                </p>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Data Protection</h2>
            <p className="text-muted-foreground text-sm">
              For data protection inquiries or to exercise your rights under the
              Swiss Federal Act on Data Protection (nDSG), please contact us at{" "}
              <a
                href="mailto:contact@helvety.com"
                className="hover:text-foreground transition-colors"
              >
                contact@helvety.com
              </a>
              . For full details on how we handle your data, see our{" "}
              <Link
                href="/privacy"
                className="hover:text-foreground underline transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Disclaimer</h2>

            <h3 className="mb-3 text-lg font-medium">Liability for Content</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We strive to keep the content of this website accurate and up to
              date. However, we cannot guarantee the accuracy, completeness, or
              timeliness of the content. As a service provider, we are
              responsible for our own content on these pages in accordance with
              general laws. However, we are not obligated to monitor transmitted
              or stored third-party information or to investigate circumstances
              that indicate illegal activity.
            </p>

            <h3 className="mt-6 mb-3 text-lg font-medium">
              Liability for Links
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Our website may contain links to external third-party websites
              over whose content we have no influence. Therefore, we cannot
              accept any liability for this third-party content. The respective
              provider or operator of the linked pages is always responsible for
              the content of the linked pages. The linked pages were checked for
              possible legal violations at the time of linking. Illegal content
              was not recognizable at the time of linking. Permanent monitoring
              of the content of the linked pages is not reasonable without
              concrete evidence of a legal violation. Upon notification of
              violations, we will remove such links immediately.
            </p>

            <h3 className="mt-6 mb-3 text-lg font-medium">
              Liability for Software and SaaS
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Our software and SaaS products are provided without guarantee of
              uninterrupted or error-free operation and without obligation to
              provide updates. Detailed disclaimers and limitations are set out
              in our{" "}
              <Link
                href="/terms"
                className="hover:text-foreground underline transition-colors"
              >
                Terms of Service
              </Link>
              .
            </p>

            <h3 className="mt-6 mb-3 text-lg font-medium">Copyright</h3>
            <p className="text-muted-foreground text-sm">
              The content and works created by the site operators on these pages
              are subject to Swiss copyright law. Reproduction, editing,
              distribution, and any kind of use outside the limits of copyright
              law require the written consent of the respective author or
              creator. Downloads and copies of this site are only permitted for
              private, non-commercial use.
            </p>
          </section>

          {/* Applicable Law */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Applicable Law and Jurisdiction
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              This Impressum and any disputes arising from or in connection with
              this website are governed by Swiss law. The exclusive place of
              jurisdiction is Basel-Stadt, Switzerland.
            </p>
            <p className="text-muted-foreground text-sm">
              Our services are offered exclusively to customers in Switzerland.
              We do not target or offer services to individuals in the European
              Union (EU) or European Economic Area (EEA).
            </p>
          </section>

          {/* Related Documents */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Related Documents</h2>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground underline transition-colors"
                >
                  Terms of Service
                </Link>
                {" - "}Usage terms, disclaimers, and limitations
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground underline transition-colors"
                >
                  Privacy Policy
                </Link>
                {" - "}How your data is handled and protected
              </li>
            </ul>
          </section>

          {/* Final Notice */}
          <footer className="border-border border-t pt-8">
            <p className="text-muted-foreground text-center text-xs">
              By using Helvety services, you acknowledge that you have read and
              understood this Impressum.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
