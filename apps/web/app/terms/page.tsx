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
      <LegalHeader title="Terms of Service" lastReviewed="September 4, 2026" />

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
              href="#eligibility"
              className="hover:text-foreground transition-colors"
            >
              Geographic Eligibility
            </a>
          </li>
          <li>
            <a href="#age" className="hover:text-foreground transition-colors">
              Minimum Age
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
            <a href="#aup" className="hover:text-foreground transition-colors">
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
            <a
              href="#transparency"
              className="hover:text-foreground transition-colors"
            >
              Transparency and Law Enforcement
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
          the provider. The Services are intended for customers in Switzerland.
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
            and public downloads (for example Helvety SPO Explorer packages and
            Helvety Power Platform Tools ZIPs).
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
            <strong className="text-foreground">Helvety SPO Explorer</strong>,{" "}
            <strong className="text-foreground">Helvety Screen Tools</strong>,
            and{" "}
            <strong className="text-foreground">
              Helvety Power Platform Tools
            </strong>
            : Microsoft 365 and Windows products distributed separately from the
            browser tools above.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          Public tools and Store listings are currently offered free of charge.
          Swiss law does not provide a general statutory right of withdrawal for
          these free public offerings. Features may change or be withdrawn.
          Enterprise add-ins and extensions you install into Microsoft 365 or a
          browser follow the host platform&apos;s rules in addition to these
          Terms.
        </p>
      </section>

      <section id="eligibility" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          3. Geographic Eligibility
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services (including helvety.com public browser tools and the
          Store) are intended for customers in Switzerland. We do not offer the
          Services to persons or entities located in the European Union or the
          European Economic Area (EU/EEA). You must not use the Services if you
          are located in the EU/EEA, or on behalf of a person or entity located
          there. Technical reachability of a public URL from outside Switzerland
          is not an offer of the Services in the EU/EEA.
        </p>
        <p className="text-muted-foreground text-sm">
          Helvety may refuse, suspend, or terminate access if it reasonably
          believes you are located in the EU/EEA, are using the Services on
          behalf of a person or entity located there, or that continued use
          would place Helvety under obligations it does not intend to assume.
        </p>
      </section>

      <section id="age" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. Minimum Age</h2>
        <p className="text-muted-foreground text-sm">
          The Services are not directed to children under 16. You must be at
          least 16 years old to use the Services. Helvety may refuse, suspend,
          or terminate access if it reasonably believes you are under 16.
        </p>
      </section>

      <section id="access" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Access and Availability
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

      <section id="aup" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">6. Acceptable Use</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          You may use the Services only for lawful purposes. You must not:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Probe, overload, or disrupt our infrastructure or downloads</li>
          <li>Circumvent rate limits, account limits, or security controls</li>
          <li>
            Use the Services to distribute malware, spam, or infringe
            others&apos; rights
          </li>
          <li>
            Misrepresent affiliation with Helvety or misuse Helvety trademarks
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          You are responsible for the lawfulness of content you process and for
          compliance with applicable law. If Helvety reasonably believes your
          use creates legal risk or harms the Service or others, Helvety may
          suspend or terminate access without prior notice when urgency
          reasonably requires it. Abuse reports:{" "}
          <a
            href="/impressum#abuse"
            className="hover:text-foreground underline transition-colors"
          >
            Impressum (Abuse)
          </a>{" "}
          or{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section id="user-content" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          7. Your Content and Local Tools
        </h2>
        <h3 className="mb-3 text-lg font-medium">7.1 Your files</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          You remain responsible for files and content you open in Helvety PDF,
          Helvety Image Editor, Helvety OCR, Screen Tools, or similar local
          software. You confirm you have the rights to process that content.
        </p>
        <h3 className="mb-3 text-lg font-medium">7.2 License to Us</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Under the current architecture, Helvety PDF, Helvety Image Editor, and
          Helvety OCR keep PDF contents, or extracted text, and images on your
          device for routine processing. You do not grant us a license to use
          that local content for our own products or AI training. If you email
          us attachments or text for support, you grant us a limited license to
          use that material only to respond and improve support quality.
        </p>
        <h3 className="mb-3 text-lg font-medium">7.3 Your Responsibilities</h3>
        <p className="text-muted-foreground text-sm">
          Keep backups of important PDFs and images. Verify extracted text and
          edited exports before relying on them. Local tools can fail or lose
          unsaved work if the browser tab closes.
        </p>
      </section>

      <section id="transparency" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          8. Transparency and Law Enforcement
        </h2>
        <p className="text-muted-foreground text-sm">
          Helvety responds to valid Swiss court orders and binding legal
          requests under applicable Swiss law. For helvety.com public tools and
          the Store, Helvety generally holds only technical metadata (for
          example IP addresses, timestamps, and download records), not user
          profiles. Abuse and law-enforcement contact details are in the{" "}
          <a
            href="/impressum#abuse"
            className="hover:text-foreground underline transition-colors"
          >
            Impressum (Abuse)
          </a>
          .
        </p>
      </section>

      <section id="ip" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          9. Intellectual Property and Source
        </h2>
        <p className="text-muted-foreground text-sm">
          Helvety branding and product names are used as trademarks by Helvety
          by Rubin. The helvety.com monorepo source is licensed under the GNU
          Affero General Public License version 3 (AGPL-3.0) or later. Other
          Helvety repositories may use different licenses, including MIT. Always
          check the repository LICENSE file or release source link for the
          package you obtain. Chrome Web Store listings and Microsoft 365
          packages remain subject to those platforms&apos; policies. Subject to
          these Terms and Acceptable Use, Helvety grants you a limited,
          non-exclusive, non-transferable, revocable right to use the Services
          for lawful purposes.
        </p>
      </section>

      <section id="liability" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          10. Disclaimers and Liability
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services are provided &quot;as is&quot; and &quot;as
          available,&quot; without warranties of any kind to the fullest extent
          permitted by Swiss law. We do not warrant fitness for a particular
          purpose, merchantability, non-infringement, or that results (including
          OCR text or PDF edits) will be accurate or complete.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          To the fullest extent permitted by law, Helvety by Rubin and Caspar
          Camille Rubin (as sole proprietor) are not liable for indirect,
          incidental, special, consequential, or punitive damages, or loss of
          data, profits, revenue, goodwill, or business, arising from use of the
          Services. Our aggregate liability for claims relating to the Services
          is limited to CHF 0 for free offerings, or the greater of CHF 100 or
          the amounts you paid Helvety for the Service in the twelve (12) months
          before the claim. Nothing excludes liability that cannot be limited
          under mandatory Swiss law (or other mandatory consumer protections
          that apply to you), including liability for death or personal injury
          caused by negligence where such limitation is prohibited, or for fraud
          or willful misconduct.
        </p>
        <p className="text-muted-foreground text-sm">
          You will defend and indemnify Helvety against claims, damages, and
          reasonable costs arising from your unlawful use of the Services, your
          content, or your breach of these Terms, except to the extent caused by
          Helvety&apos;s willful misconduct.
        </p>
      </section>

      <section id="governing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">11. Governing Law</h2>
        <p className="text-muted-foreground text-sm">
          These Terms are governed by the substantive laws of Switzerland,
          excluding conflict-of-law rules. Exclusive jurisdiction is
          Basel-Stadt, Switzerland, except where mandatory law provides
          otherwise. Mandatory consumer rights that cannot be waived under
          applicable law remain unaffected. We do not offer the Services in the
          EU/EEA (see Geographic Eligibility).
        </p>
      </section>

      <section id="changes" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">12. Changes</h2>
        <p className="text-muted-foreground text-sm">
          We may update these Terms by posting a revised version on this page.
          Continued use after the &quot;Last reviewed&quot; date means you
          accept the updated Terms.
        </p>
      </section>

      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">13. Contact</h2>
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
