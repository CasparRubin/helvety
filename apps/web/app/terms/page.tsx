import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import {
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
} from "@helvety/shared/power-platform-configurator-copy";

import "@/app/legal.css";
import {
  LegalFooterNote,
  LegalHeader,
  LegalPageShell,
  LegalToc,
} from "@/components/legal-document";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Helvety products and apps",
  alternates: {
    canonical: `${urls.home}/terms`,
  },
};

/** Terms of Service page for Helvety */
export default function TermsPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Terms of Service" lastReviewed="July 28, 2026" />

      <LegalToc>
        <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
        <ol className="text-muted-foreground list-outside list-decimal space-y-1 pl-5 text-sm">
          <li>
            <a
              href="#acceptance"
              className="hover:text-foreground transition-colors"
            >
              Acceptance
            </a>
          </li>
          <li>
            <a
              href="#products"
              className="hover:text-foreground transition-colors"
            >
              Products
            </a>
          </li>
          <li>
            <a
              href="#access"
              className="hover:text-foreground transition-colors"
            >
              Access and Availability
            </a>
          </li>
          <li>
            <a
              href="#acceptable-use"
              className="hover:text-foreground transition-colors"
            >
              Acceptable Use
            </a>
          </li>
          <li>
            <a
              href="#user-content"
              className="hover:text-foreground transition-colors"
            >
              Your Content and Local Tools
            </a>
          </li>
          <li>
            <a href="#ip" className="hover:text-foreground transition-colors">
              Intellectual Property and Source
            </a>
          </li>
          <li>
            <a
              href="#liability"
              className="hover:text-foreground transition-colors"
            >
              Disclaimers and Liability
            </a>
          </li>
          <li>
            <a
              href="#governing"
              className="hover:text-foreground transition-colors"
            >
              Governing Law
            </a>
          </li>
          <li>
            <a
              href="#changes"
              className="hover:text-foreground transition-colors"
            >
              Changes
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </li>
        </ol>
      </LegalToc>

      <section id="acceptance" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">1. Acceptance</h2>
        <p className="text-muted-foreground text-sm">
          By using helvety.com or any Helvety product that links to these Terms
          (&quot;the Services&quot;), you agree to these Terms and our{" "}
          <a
            href="/privacy"
            className="hover:text-foreground underline transition-colors"
          >
            Privacy Policy
          </a>
          . If you do not agree, do not use the Services. Helvety by Rubin is
          the provider. Services are primarily intended for users in
          Switzerland.
        </p>
      </section>

      <section id="products" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">2. Products</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Current Helvety offerings include:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Helvety PDF</strong>,{" "}
            <strong className="text-foreground">Helvety Image Editor</strong>,
            and <strong className="text-foreground">Helvety OCR</strong>:
            browser tools on helvety.com that process files on your device under
            the current architecture.
          </li>
          <li>
            <strong className="text-foreground">Helvety Store</strong>: catalog
            and public downloads (for example Helvety SPO Explorer packages).
          </li>
          <li>
            <strong className="text-foreground">
              Power Platform Configurator
            </strong>
            : {POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}{" "}
            {POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX} Distributed via the
            Chrome Web Store.
          </li>
          <li>
            <strong className="text-foreground">Helvety SPO Explorer</strong>{" "}
            and{" "}
            <strong className="text-foreground">Helvety Screen Tools</strong>:
            Microsoft 365 and Windows products distributed separately from the
            browser tools above.
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety Cloud (helvety.cloud) is a separate product and repository
          with its own terms, privacy policy, and LICENSE. These Terms do not
          cover Helvety Cloud.
        </p>
        <p className="text-muted-foreground text-sm">
          Listed products are currently offered free of charge. Features may
          change or be withdrawn. Enterprise add-ins and extensions you install
          into Microsoft 365 or a browser follow the host platform&apos;s rules
          in addition to these Terms.
        </p>
      </section>

      <section id="access" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          3. Access and Availability
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Product Access Characteristics
          </strong>
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Helvety PDF never asks you to log in for routine PDF edits.</li>
          <li>
            Helvety Image Editor does not require login for the standard
            annotation flow.
          </li>
          <li>
            Helvety OCR does not require login for the standard text-extraction
            flow.
          </li>
          <li>
            Helvety Store catalog browsing and public downloads do not require a
            Helvety account.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            Product Access and Availability
          </strong>
          : We aim for reliable uptime but do not guarantee uninterrupted or
          error-free service. Maintenance, outages, rate limits, and third-party
          platform changes (Microsoft, Google Chrome Web Store, hosting, GitHub
          Releases) may affect access.
        </p>
      </section>

      <section id="acceptable-use" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. Acceptable Use</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          You may use the Services only for lawful purposes. You must not:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>Probe, overload, or disrupt our infrastructure or downloads</li>
          <li>Circumvent rate limits or security controls</li>
          <li>
            Use the Services to distribute malware or infringe others&apos;
            rights
          </li>
          <li>
            Misrepresent affiliation with Helvety or misuse Helvety trademarks
          </li>
        </ul>
      </section>

      <section id="user-content" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Your Content and Local Tools
        </h2>
        <h3 className="mb-3 text-lg font-medium">5.1 Your files</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          You remain responsible for files and content you open in Helvety PDF,
          Helvety Image Editor, Helvety OCR, Screen Tools, or similar local
          software. You confirm you have the rights to process that content.
        </p>
        <h3 className="mb-3 text-lg font-medium">5.2 License to Us</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Under the current architecture, Helvety PDF, Helvety Image Editor, and
          Helvety OCR keep PDF contents, or extracted text, and images on your
          device for routine processing. You do not grant us a license to use
          that local content for our own products or AI training. If you email
          us attachments or text for support, you grant us a limited license to
          use that material only to respond and improve support quality.
        </p>
        <h3 className="mb-3 text-lg font-medium">5.3 Your Responsibilities</h3>
        <p className="text-muted-foreground text-sm">
          Keep backups of important PDFs and images. Verify extracted text and
          edited exports before relying on them. Local tools can fail or lose
          unsaved work if the browser tab closes.
        </p>
      </section>

      <section id="ip" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          6. Intellectual Property and Source
        </h2>
        <p className="text-muted-foreground text-sm">
          Helvety branding and product names are used as trademarks by Helvety
          by Rubin. The helvety.com monorepo source is licensed under the GNU
          Affero General Public License version 3 (AGPL-3.0) or later. Other
          Helvety repositories may use different licenses, including MIT. Always
          check the repository LICENSE file or release source link for the
          package you obtain. Chrome Web Store listings and Microsoft 365
          packages remain subject to those platforms&apos; policies.
        </p>
      </section>

      <section id="liability" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          7. Disclaimers and Liability
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services are provided &quot;as is&quot; and &quot;as
          available,&quot; without warranties of any kind to the fullest extent
          permitted by Swiss law. We do not warrant fitness for a particular
          purpose, merchantability, non-infringement, or that results (including
          OCR text or PDF edits) will be accurate or complete.
        </p>
        <p className="text-muted-foreground text-sm">
          To the fullest extent permitted by law, Helvety by Rubin is not liable
          for indirect, incidental, special, consequential, or punitive damages,
          or loss of data, profits, or business, arising from use of the
          Services. Our aggregate liability for claims relating to the Services
          is limited to CHF 0 for free offerings, or the amount you paid us for
          the specific paid service giving rise to the claim in the twelve
          months before the claim (if any). Nothing excludes liability that
          cannot be limited under mandatory Swiss law.
        </p>
      </section>

      <section id="governing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">8. Governing Law</h2>
        <p className="text-muted-foreground text-sm">
          These Terms are governed by Swiss law. Exclusive jurisdiction is
          Basel-Stadt, Switzerland, except where mandatory law provides
          otherwise. We do not actively target EU/EEA markets.
        </p>
      </section>

      <section id="changes" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">9. Changes</h2>
        <p className="text-muted-foreground text-sm">
          We may update these Terms by posting a revised version on this page.
          Continued use after the &quot;Last reviewed&quot; date means you
          accept the updated Terms.
        </p>
      </section>

      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">10. Contact</h2>
        <p className="text-muted-foreground text-sm">
          Questions:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          . See also the{" "}
          <a
            href="/impressum"
            className="hover:text-foreground underline transition-colors"
          >
            Impressum
          </a>
          .
        </p>
      </section>

      <LegalFooterNote>
        <p className="text-muted-foreground text-center text-xs">
          By using Helvety services, you agree to these Terms of Service.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
