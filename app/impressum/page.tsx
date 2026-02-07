import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | Helvety",
  description: "Impressum for Helvety - Software and Subscriptions",
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
              Impressum gemäss Art. 3 UWG / Legal Notice pursuant to Swiss
              Unfair Competition Act
            </p>
          </header>

          {/* Company Information */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Company Information</h2>
            <div className="border-border bg-card space-y-4 border p-6">
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
                    className="hover:text-foreground transition-colors"
                  >
                    contact@helvety.com
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Phone:{" "}
                  <a
                    href="tel:+41798700208"
                    className="hover:text-foreground transition-colors"
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
                <p className="text-muted-foreground">
                  VAT: Not subject to VAT (Nicht MWST-pflichtig)
                </p>
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
              software-as-a-service (SaaS) subscriptions. All products are
              designed and developed in Switzerland.
            </p>
          </section>

          {/* Trademark */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Trademark</h2>
            <p className="text-muted-foreground text-sm">
              The Helvety brand is a registered Swiss trademark. All rights
              reserved.
            </p>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Data Protection</h2>
            <p className="text-muted-foreground text-sm">
              For data protection inquiries, to exercise your rights under the
              Swiss Federal Act on Data Protection (nDSG), the EU General Data
              Protection Regulation (GDPR), or other applicable data protection
              laws, please contact us at{" "}
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

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Liability for Content
                </h3>
                <p className="text-muted-foreground text-sm">
                  The content of this website has been created with the greatest
                  possible care. However, we cannot guarantee the accuracy,
                  completeness, or timeliness of the content. As a service
                  provider, we are responsible for our own content on these
                  pages in accordance with general laws. However, we are not
                  obligated to monitor transmitted or stored third-party
                  information or to investigate circumstances that indicate
                  illegal activity.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Liability for Links
                </h3>
                <p className="text-muted-foreground text-sm">
                  Our website may contain links to external third-party websites
                  over whose content we have no influence. Therefore, we cannot
                  accept any liability for this third-party content. The
                  respective provider or operator of the linked pages is always
                  responsible for the content of the linked pages. The linked
                  pages were checked for possible legal violations at the time
                  of linking. Illegal content was not recognizable at the time
                  of linking. Permanent monitoring of the content of the linked
                  pages is not reasonable without concrete evidence of a legal
                  violation. Upon notification of violations, we will remove
                  such links immediately.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Liability for Software and SaaS
                </h3>
                <p className="text-muted-foreground text-sm">
                  Our software and SaaS products are provided without guarantee
                  of uninterrupted or error-free operation and without
                  obligation to provide updates. Detailed disclaimers and
                  limitations are set out in our{" "}
                  <Link
                    href="/terms"
                    className="hover:text-foreground underline transition-colors"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Copyright</h3>
                <p className="text-muted-foreground text-sm">
                  The content and works created by the site operators on these
                  pages are subject to Swiss copyright law. Reproduction,
                  editing, distribution, and any kind of use outside the limits
                  of copyright law require the written consent of the respective
                  author or creator. Downloads and copies of this site are only
                  permitted for private, non-commercial use.
                </p>
              </div>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Dispute Resolution</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              The European Commission provides a platform for online dispute
              resolution (ODR):{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline transition-colors"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="text-muted-foreground text-sm">
              We are not obligated and generally not willing to participate in
              dispute resolution proceedings before a consumer arbitration
              board.
            </p>
          </section>

          {/* Applicable Law */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Applicable Law and Jurisdiction
            </h2>
            <p className="text-muted-foreground text-sm">
              This Impressum and any disputes arising from or in connection with
              this website are governed by Swiss law. The exclusive place of
              jurisdiction is Basel-Stadt, Switzerland.
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
                {" — "}Usage terms, disclaimers, and limitations
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground underline transition-colors"
                >
                  Privacy Policy
                </Link>
                {" — "}How your data is handled and protected
              </li>
            </ul>
          </section>

          {/* Last Updated */}
          <footer className="border-border border-t pt-8">
            <p className="text-muted-foreground text-center text-xs">
              Last updated: February 7, 2026
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
