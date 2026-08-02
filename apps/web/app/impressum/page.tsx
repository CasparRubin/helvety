import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import {
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE,
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
} from "@helvety/shared/power-platform-configurator-copy";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import "@/app/legal.css";
import {
  LegalCard,
  LegalFooterNote,
  LegalHeader,
  LegalPageShell,
  LegalSection,
  LegalSubsection,
} from "@/components/legal-document";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum for Helvety products and apps",
  alternates: {
    canonical: `${urls.home}/impressum`,
  },
};

/** Legal notice / Impressum page for Helvety */
export default function ImpressumPage() {
  return (
    <LegalPageShell>
      <LegalHeader
        title="Impressum"
        lastReviewed="August 2, 2026"
        subtitle={
          <>
            Impressum gemäss Art. 3 Abs. 1 lit. s UWG / Legal Notice pursuant to
            Swiss Unfair Competition Act
          </>
        }
      />

      <LegalSection title="Company Information">
        <LegalCard>
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
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-foreground underline transition-colors"
              >
                {CONTACT_EMAIL}
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
              Caspar Camille Rubin (Verantwortlich für den Inhalt)
            </p>
          </div>
        </LegalCard>
      </LegalSection>

      <LegalSection title="Business Activity">
        <p className="text-muted-foreground mb-3 text-sm">
          Helvety by Rubin designs and ships software products and web
          applications across end-to-end encrypted cloud workspaces, Microsoft
          365 integrations, browser utilities, and desktop tooling. Public tools
          and Store listings are currently free of charge. Helvety Cloud offers
          a free plan and paid plans. Where source repositories are published,
          the repository LICENSE file governs. The helvety.com monorepo is
          licensed under the GNU Affero General Public License version 3 or
          later (AGPL-3.0). Other Helvety repositories may use different
          licenses, including MIT. Development is primarily based in
          Switzerland. Services are not offered in the EU/EEA.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Helvety Cloud</strong>{" "}
            (helvety.cloud): passwordless, end-to-end encrypted workspace
            service.
          </li>
          <li>
            <strong className="text-foreground">Helvety SPO Explorer</strong>:
            SharePoint Framework navigation for sites you can access.
          </li>
          <li>
            <strong className="text-foreground">
              Power Platform Configurator
            </strong>
            : {POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} Edge/Chrome extension
            available on the Chrome Web Store.{" "}
            {POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX}{" "}
            {POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE}
          </li>
          <li>
            <strong className="text-foreground">Helvety PDF</strong>: in-browser
            PDF toolkit for supported local workflows.
          </li>
          <li>
            <strong className="text-foreground">Helvety Screen Tools</strong>:
            Windows desktop capture and Live Draw overlay.
          </li>
          <li>
            <strong className="text-foreground">Helvety Image Editor</strong>:
            browser-based image annotation with on-device processing.
          </li>
          <li>
            <strong className="text-foreground">Helvety OCR</strong>:
            browser-based text extraction from PDFs and images with on-device
            optical character recognition.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Trademark">
        <p className="text-muted-foreground text-sm">
          The Helvety name is used as a trademark by Helvety by Rubin. All
          rights reserved for trademarks and brand assets to the extent
          permitted by law. This does not limit source-code rights granted in
          official public repositories under the applicable repository license.
        </p>
      </LegalSection>

      <LegalSection id="abuse" title="Abuse Reporting">
        <p className="text-muted-foreground mb-4 text-sm">
          If you believe the Services are used for illegal activity, or if you
          are a law enforcement authority with a legal request, contact:
        </p>
        <LegalCard>
          <div>
            <p className="text-foreground mb-1 font-medium">
              Contact for Abuse Reports
            </p>
            <p className="text-muted-foreground">
              Email:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-foreground underline transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <div>
            <p className="text-foreground mb-1 font-medium">What to Include</p>
            <ul className="text-muted-foreground list-outside list-disc space-y-1 pl-5 text-sm">
              <li>Description of the suspected activity or content</li>
              <li>Any identifiers you have (for example a request time)</li>
              <li>Your contact information for follow-up</li>
              <li>Legal basis, if known</li>
            </ul>
          </div>
          <div>
            <p className="text-foreground mb-1 font-medium">
              For Law Enforcement
            </p>
            <p className="text-muted-foreground">
              Legal requests must follow applicable Swiss law. We respond to
              valid Swiss court orders and binding legal requests. helvety.com
              public tools do not require accounts, so for those surfaces we
              generally hold only technical metadata (for example IP addresses,
              timestamps, and download records), not profiles. Helvety Cloud
              holds account and membership metadata plus opaque ciphertext;
              Helvety cannot produce encrypted plaintext. Routine security
              metadata has a target retention window up to about 6 months under
              current policy, subject to legal hold. Local desktop content (for
              example Screen Tools screenshots) is not available to us unless
              you sent it separately. Reports that require Helvety to read
              Helvety Cloud ciphertext cannot be fulfilled.
            </p>
          </div>
        </LegalCard>
      </LegalSection>

      <LegalSection title="Data Protection">
        <p className="text-muted-foreground text-sm">
          For data protection inquiries under the Swiss Federal Act on Data
          Protection (nDSG), contact{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          . Details:{" "}
          <Link
            href="/privacy"
            className="hover:text-foreground underline transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <LegalSubsection title="Liability for Content">
          <p className="text-muted-foreground mb-4 text-sm">
            We strive to keep website content accurate, but we cannot guarantee
            completeness or timeliness. We are responsible for our own content
            under general laws and are not obligated to monitor third-party
            information transmitted or stored through the Services.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Liability for Links">
          <p className="text-muted-foreground mb-4 text-sm">
            External links are outside our control. The linked site&apos;s
            operator is responsible for that content. We remove links after
            notice of legal violations as soon as reasonably practicable.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Liability for Software">
          <p className="text-muted-foreground mb-4 text-sm">
            Software is provided without guarantee of uninterrupted or
            error-free operation. See our{" "}
            <Link
              href="/terms"
              className="hover:text-foreground underline transition-colors"
            >
              Terms of Service
            </Link>
            .
          </p>
        </LegalSubsection>

        <LegalSubsection title="Copyright">
          <p className="text-muted-foreground text-sm">
            Website content is subject to Swiss copyright law except where a
            public repository LICENSE grants broader rights to source code.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="Applicable Law and Jurisdiction">
        <p className="text-muted-foreground mb-4 text-sm">
          This Impressum is governed by Swiss law. Exclusive place of
          jurisdiction is Basel-Stadt, Switzerland, except where mandatory law
          provides otherwise.
        </p>
        <p className="text-muted-foreground text-sm">
          Services are primarily intended for customers in Switzerland. We do
          not offer the Services in the EU/EEA. See{" "}
          <Link
            href="/terms#eligibility"
            className="hover:text-foreground underline transition-colors"
          >
            Terms (Geographic Eligibility)
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Related Documents">
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            <Link
              href="/terms"
              className="hover:text-foreground underline transition-colors"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="hover:text-foreground underline transition-colors"
            >
              Privacy Policy
            </Link>
          </li>
        </ul>
      </LegalSection>

      <LegalFooterNote>
        <p className="text-muted-foreground text-center text-xs">
          By using Helvety services, you acknowledge that this Impressum
          applies.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
