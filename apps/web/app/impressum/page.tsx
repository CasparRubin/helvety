import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
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
  title: "Impressum | Helvety",
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
        lastReviewed="April 28, 2026"
        subtitle={
          <>
            Impressum gemäss Art. 3 Abs. 1 lit. s UWG / Legal Notice pursuant to
            Swiss Unfair Competition Act
          </>
        }
      />

      {/* Company Information */}
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

      {/* Business Activity */}
      <LegalSection title="Business Activity">
        <p className="text-muted-foreground mb-3 text-sm">
          Helvety by Rubin designs and ships software products and web
          applications across Microsoft 365 integrations, browser utilities,
          desktop tooling, and encrypted productivity apps. The listed products
          are currently offered free of charge. Where source repositories are
          published, licensing is defined by each repository&apos;s LICENSE file
          (currently MIT in the referenced public repositories). Product
          development is primarily based in Switzerland.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Helvety SPO Explorer</strong> —
            SharePoint Framework navigation for sites you can access.
          </li>
          <li>
            <strong className="text-foreground">
              Power Automate Editor Version Enforcer
            </strong>{" "}
            — Allows you to enforce either the Classic or New Designer
            experience in Microsoft Power Automate Cloud Flows using{" "}
            <code className="text-foreground">v3=false</code> or{" "}
            <code className="text-foreground">v3=true</code>, while also giving
            you the option to hide the Microsoft survey prompt asking why you
            made your selection. Edge/Chrome MV3 extension. Survey tab: optional{" "}
            <code className="text-foreground">v3survey</code> — Hide (default)
            sets false on rewrites; Show only normalizes when already present.
            Paused: no URL rewrites while the extension stays installed.
          </li>
          <li>
            <strong className="text-foreground">Helvety PDF</strong> —
            in-browser PDF toolkit for supported local workflows.
          </li>
          <li>
            <strong className="text-foreground">Helvety Screen Tools</strong> —
            Windows desktop capture and Live Draw overlay.
          </li>
          <li>
            <strong className="text-foreground">Helvety Image Upscaler</strong>{" "}
            — browser-based upscaling with on-device processing where supported.
          </li>
          <li>
            <strong className="text-foreground">Helvety Tasks</strong> —
            encrypted task boards with staged workflows.
          </li>
          <li>
            <strong className="text-foreground">Helvety Contacts</strong> —
            encrypted contact management with export tooling.
          </li>
          <li>
            <strong className="text-foreground">Helvety Notes</strong> —
            encrypted notes grouped by Personal, Work, and Other.
          </li>
        </ul>
      </LegalSection>

      {/* Trademark */}
      <LegalSection title="Trademark">
        <p className="text-muted-foreground text-sm">
          The Helvety name is used as a trademark by Helvety by Rubin. All
          rights reserved for trademarks and brand assets to the extent
          permitted by law. This does not limit source-code rights granted in
          official public repositories under the applicable MIT license.
        </p>
      </LegalSection>

      {/* Abuse Reporting */}
      <LegalSection id="abuse" title="Abuse Reporting">
        <p className="text-muted-foreground mb-4 text-sm">
          If you believe that our Services are being used for illegal activity,
          or if you are a law enforcement authority with a legal request, please
          contact us:
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
            <p className="text-foreground mb-1 font-medium">
              What to Include in a Report
            </p>
            <ul className="text-muted-foreground list-outside list-disc space-y-1 pl-5 text-sm">
              <li>Description of the suspected illegal activity or content</li>
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
              Legal requests must be issued in accordance with applicable Swiss
              law. We respond to valid Swiss court orders and binding legal
              requests. For services using end-to-end encryption, our
              architecture is designed so we are generally unable to access
              plaintext user content during normal operation. Depending on the
              service and legal basis, we may provide available non-encrypted
              metadata (for example account identifiers, IP addresses,
              timestamps, and storage usage information). Typical security/abuse
              metadata has a target retention window up to 6 months under
              current operational policy (subject to legal hold, incident
              handling, and technical constraints), while legally required
              contract/accounting evidence may be retained longer (for example
              up to 10 years where required by Swiss law).
            </p>
            <p className="text-muted-foreground mt-2">
              For local-device software (for example Helvety Screen Tools), we
              generally cannot provide local screenshot or annotation content
              unless that content was separately provided to us by the user (for
              example via support communication).
            </p>
          </div>
          <div>
            <p className="text-foreground mb-1 font-medium">
              Response Commitment
            </p>
            <p className="text-muted-foreground">
              We aim to acknowledge abuse reports as promptly as reasonably
              possible, subject to request volume, legal requirements, and case
              complexity.
            </p>
          </div>
        </LegalCard>
      </LegalSection>

      {/* Data Protection */}
      <LegalSection title="Data Protection">
        <p className="text-muted-foreground text-sm">
          For data protection inquiries or to exercise your rights under the
          Swiss Federal Act on Data Protection (nDSG), please contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground transition-colors"
          >
            {CONTACT_EMAIL}
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
      </LegalSection>

      {/* Disclaimer */}
      <LegalSection title="Disclaimer">
        <LegalSubsection title="Liability for Content">
          <p className="text-muted-foreground mb-4 text-sm">
            We strive to keep the content of this website accurate and up to
            date. However, we cannot guarantee the accuracy, completeness, or
            timeliness of the content. As a service provider, we are responsible
            for our own content on these pages in accordance with general laws.
            However, we are not obligated to monitor transmitted or stored
            third-party information or to investigate circumstances that
            indicate illegal activity.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Liability for Links">
          <p className="text-muted-foreground mb-4 text-sm">
            Our website may contain links to external third-party websites over
            whose content we have no influence. Therefore, we cannot accept any
            liability for this third-party content. The respective provider or
            operator of the linked pages is generally responsible for the
            content of the linked pages. The linked pages were checked for
            possible legal violations at the time of linking. Illegal content
            was not recognizable at the time of linking. Permanent monitoring of
            the content of the linked pages is not reasonable without concrete
            evidence of a legal violation. Upon notification of violations, we
            will remove such links as soon as reasonably practicable.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Liability for Software and SaaS">
          <p className="text-muted-foreground mb-4 text-sm">
            Our software and SaaS products are provided without guarantee of
            uninterrupted or error-free operation and without obligation to
            provide updates. Detailed disclaimers and limitations are set out in
            our{" "}
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
            The content and works created by the site operators on these pages
            are subject to Swiss copyright law. Reproduction, editing,
            distribution, and any kind of use outside the limits of copyright
            law require the written consent of the respective author or creator.
            Source code published in Helvety public repositories is licensed
            under the MIT License in the corresponding repository.
          </p>
        </LegalSubsection>
      </LegalSection>

      {/* Applicable Law */}
      <LegalSection title="Applicable Law and Jurisdiction">
        <p className="text-muted-foreground mb-4 text-sm">
          This Impressum and any disputes arising from or in connection with
          this website are governed by Swiss law. The exclusive place of
          jurisdiction is Basel-Stadt, Switzerland, except where mandatory law
          provides otherwise.
        </p>
        <p className="text-muted-foreground text-sm">
          Our services are primarily intended for customers in Switzerland, and
          we do not actively target EU/EEA markets at this time. Sign-in for
          account-based services requires a confirmation that the user is not
          located in the EU/EEA before verification-code delivery. This
          attestation is an eligibility control, not strict geolocation
          enforcement, and technical access from outside Switzerland may still
          occur. Where mandatory law in another jurisdiction applies in a
          specific case, those mandatory provisions remain unaffected.
        </p>
      </LegalSection>

      {/* Related Documents */}
      <LegalSection title="Related Documents">
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
      </LegalSection>

      {/* Final Notice */}
      <LegalFooterNote>
        <p className="text-muted-foreground text-center text-xs">
          By using Helvety services, you acknowledge that this Impressum applies
          to your use of the services.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
