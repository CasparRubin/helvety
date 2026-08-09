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
      <LegalHeader title="Terms of Service" lastReviewed="August 9, 2026" />

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
            <a href="#e2ee" className="hover:text-foreground transition-colors">
              Helvety Cloud and E2EE
            </a>
          </li>
          <li>
            <a
              href="#billing"
              className="hover:text-foreground transition-colors"
            >
              Billing
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
          By using helvety.com, helvety.cloud, or any Helvety product that links
          to these Terms (&quot;the Services&quot;), you agree to these Terms
          and our{" "}
          <a
            href="/privacy"
            className="hover:text-foreground underline transition-colors"
          >
            Privacy Policy
          </a>
          . If you do not agree, do not use the Services. Helvety by Rubin is
          the provider. The Services are intended for customers in Switzerland.
          For Helvety Cloud, creating an account or accepting these Terms in the
          product also binds you to the Acceptable Use section, the E2EE /
          zero-access notice, Geographic Eligibility, Minimum Age, and the
          Billing section below. Invited Helvety Cloud members must accept the
          current gated policies before encryption unlock or use.
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
          <li>
            <strong className="text-foreground">Helvety Cloud</strong>{" "}
            (helvety.cloud): passwordless, end-to-end encrypted workspace
            service with email one-time-code sign-in, device unlock via WebAuthn
            PRF / passkey, and optional paid plans via Stripe.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          Public tools and Store listings are currently offered free of charge.
          Helvety Cloud has a free plan and paid options described under
          Billing. Features may change or be withdrawn. Enterprise add-ins and
          extensions you install into Microsoft 365 or a browser follow the host
          platform&apos;s rules in addition to these Terms.
        </p>
      </section>

      <section id="eligibility" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          3. Geographic Eligibility
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services (including helvety.com public browser tools, the Store,
          and Helvety Cloud) are intended for customers in Switzerland. We do
          not offer the Services to persons or entities located in the European
          Union or the European Economic Area (EU/EEA). You must not use the
          Services if you are located in the EU/EEA, or on behalf of a person or
          entity located there. Technical reachability of a public URL from
          outside Switzerland is not an offer of the Services in the EU/EEA.
        </p>
        <p className="text-muted-foreground text-sm">
          When Helvety Cloud requires acknowledgment of this section, you
          warrant that you are not located in the EU/EEA and are not using the
          Service on behalf of a person or entity located there. Helvety may
          refuse, suspend, or terminate access if it reasonably believes this
          warranty is false or that continued use would place Helvety under
          obligations it does not intend to assume.
        </p>
      </section>

      <section id="age" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. Minimum Age</h2>
        <p className="text-muted-foreground text-sm">
          The Services are not directed to children under 16. You must be at
          least 16 years old to create a Helvety Cloud account or use Helvety
          Cloud. When Helvety Cloud requires acknowledgment of this section, you
          confirm that you meet this minimum age. If Helvety reasonably believes
          you are under 16, it may suspend or delete the account.
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
          <li>
            Helvety Cloud requires an email account for one-time-code sign-in
            and a separate unlock passkey for encryption. Session sign-in is not
            the same as encryption unlock.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            Product Access and Availability
          </strong>
          : We aim for reliable uptime but do not guarantee uninterrupted or
          error-free service. Maintenance, outages, rate limits, and third-party
          platform changes (Microsoft, Google Chrome Web Store, hosting, GitHub
          Releases, Supabase, Stripe) may affect access.
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
          <li>
            Use Helvety Cloud for illegal activity, including storage or
            distribution of illegal content, child sexual abuse material,
            prohibited terrorism content, harassment, fraud, or unauthorized
            access to systems
          </li>
          <li>
            Scrape or harvest Helvety Cloud accounts without authorization, or
            probe systems except through coordinated responsible disclosure to
            Helvety
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Because Helvety Cloud data is end-to-end encrypted, Helvety cannot
          moderate plaintext. Enforcement options are limited to account-level
          and ciphertext-level measures (for example suspending accounts,
          deleting encrypted blobs or workspaces, or blocking access) based on
          signals Helvety can see, such as abuse of APIs, illegal account
          activity, or lawful requests relating to metadata Helvety holds.
          Helvety does not claim the ability to inspect or &quot;clean&quot;
          encrypted content.
        </p>
        <p className="text-muted-foreground text-sm">
          You are responsible for the lawfulness of content you process or
          encrypt and for compliance with applicable law. Helvety&apos;s
          inability to read Cloud data does not authorize illegal use. If
          Helvety reasonably believes your use creates legal risk or harms the
          Service or others, Helvety may suspend or terminate access without
          prior notice when urgency reasonably requires it. Abuse reports:{" "}
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
          use that material only to respond and improve support quality. For
          Helvety Cloud, you retain ownership of content you create and grant
          Helvety only the rights needed to store and transmit ciphertext and
          related metadata to operate the Service.
        </p>
        <h3 className="mb-3 text-lg font-medium">7.3 Your Responsibilities</h3>
        <p className="text-muted-foreground text-sm">
          Keep backups of important PDFs and images. Verify extracted text and
          edited exports before relying on them. Local tools can fail or lose
          unsaved work if the browser tab closes. For Helvety Cloud, keep
          control of your email, unlock passkey, devices, and any recovery
          export. Helvety cannot reset encryption access for you.
        </p>
      </section>

      <section id="e2ee" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          8. Helvety Cloud and E2EE / Zero-Access Notice
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          This section is a core part of how Helvety Cloud works. You must
          acknowledge it before encryption setup in the product.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety cannot decrypt your data. There is no company master key, no
          key escrow, and no support workflow that restores encrypted plaintext.
          Authentication (email OTP for session) is separate from encryption
          unlock. A signed-in session does not mean Helvety can read encrypted
          workspace data.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          If you lose your unlock passkey / PRF capability and any recovery
          export you were shown, Helvety cannot recover your data. Lost keys
          mean permanent loss of that encrypted content. Any recovery export
          shown during setup must be stored offline by you. Never email it to
          Helvety or paste it into support channels with an expectation of
          restoration.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Encrypted content lives in workspaces. Every invited member has the
          same rights: invite others, remove members, manage billing, and delete
          the workspace. Only invite people you trust fully. Leaving a shared
          workspace, or being removed, drops your membership and wrapped keys
          for that workspace. Content stays for remaining members. Helvety does
          not rotate workspace keys when someone leaves or is removed. If you
          are the only member and leave, or if any member deletes the workspace,
          its ciphertext is permanently deleted for everyone. Your Personal
          workspace cannot be left or deleted except by deleting your account.
          Deleting your account permanently removes your account data and
          workspaces where you are the only member. Shared workspaces remain for
          other members.
        </p>
        <p className="text-muted-foreground text-sm">
          By accepting this notice you confirm that you understand Helvety
          cannot read or restore your data, that you are responsible for your
          content and keys, and that permanent data loss is possible if unlock
          or recovery material is lost. Helvety Cloud is not a plaintext backup,
          not a key-recovery service, and not a content host that can inspect or
          restore your encrypted workspace content. Support cannot decrypt your
          data or restore lost keys.
        </p>
      </section>

      <section id="billing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">9. Billing</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          This section applies to Helvety Cloud. Public tools and Store listings
          that are free remain free unless we state otherwise for a specific
          paid product. Provider identity for electronic commerce: Helvety by
          Rubin, Holeestrasse 116, 4054 Basel, Switzerland; email{" "}
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
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety Cloud offers a free plan and a paid Pro Workspace plan per
          workspace, processed through Stripe, plus an optional Capacity
          Increase add-on that raises paid limits together. Prices are shown in
          Swiss francs (CHF). Applicable Swiss VAT (MWST), if Helvety collects
          it for your purchase, appears at Stripe Checkout or on the invoice;
          Helvety does not invent a VAT number on these Terms. Nothing is
          charged unless a workspace member explicitly starts Checkout (where
          the price is shown before any charge) or changes paid add-ons. Any
          discounts are applied through Stripe. Helvety does not issue separate
          in-app discount or complimentary codes. These terms do not themselves
          create an obligation to purchase.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Technical steps to a paid contract (UWG electronic commerce): (1) a
          workspace member opens billing in Helvety Cloud and chooses Pro
          Workspace and any add-ons; (2) Stripe Checkout shows the price, taxes
          if any, and plan details, and lets you correct payment details before
          confirming; (3) you confirm payment in Stripe Checkout (the step that
          creates the chargeable order); (4) Stripe sends an electronic order or
          payment confirmation to the email associated with the payment. You can
          review and correct inputs in Checkout before you confirm. Leaving
          Checkout without confirming does not create a paid subscription.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          The free plan applies fair-use limits per workspace. File uploads and
          document storage are not available on the free plan. Current limits
          are shown in the product where they apply. Each account may have one
          free-tier workspace attributed to it (typically the Personal
          workspace). Additional workspaces attributed to the account require
          Pro Workspace access for that workspace. If a paid Pro Workspace ends
          and you would then own more than one free-tier workspace, Helvety may
          soft-lock the overflow workspace(s): existing encrypted content stays
          available to open, edit, download, export, and delete, but creating
          new resources in that workspace is paused until you upgrade or reduce
          owned free workspaces. Helvety does not delete ciphertext or withhold
          wrapped keys solely because a workspace is soft-locked.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Subscriptions are workspace-scoped: any member may manage that
          workspace&apos;s Pro Workspace plan and add-ons. Leaving a Pro
          workspace does not cancel billing. Pro Workspace includes higher
          operational limits and encrypted file and document storage for that
          workspace, within limits shown in the product. Uploaded files are
          end-to-end encrypted on your device; Helvety stores ciphertext and
          operational size meters only. Capacity Increase requires an active Pro
          Workspace subscription. Prices, billing intervals, renewals, taxes,
          and any Stripe-applied discount are shown at Stripe Checkout or in the
          billing portal. Unless stated otherwise, subscriptions renew
          automatically until cancelled. You may cancel renewal at any time in
          the Stripe billing portal; access to paid limits continues through the
          paid period already purchased unless stated otherwise. Helvety never
          needs encrypted plaintext or raw encryption keys for billing.
        </p>
        <p className="text-muted-foreground text-sm">
          Swiss law does not provide a general statutory right of withdrawal for
          ordinary online SaaS contracts concluded over the internet. Helvety
          does not offer a voluntary cooling-off period beyond what Stripe or
          mandatory law requires in a specific case. If mandatory consumer law
          that applies to you grants a withdrawal right for digital services,
          Helvety will honor that right as required. That carve-out does not
          mean Helvety offers the Services in the EU/EEA. If a paid plan is
          active and payment fails, Helvety may retry charges and may end paid
          entitlements after notice so free-plan limits apply. Billing
          questions:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section id="transparency" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          10. Transparency and Law Enforcement
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety responds to valid Swiss court orders and binding legal
          requests under applicable Swiss law. For Helvety Cloud, Helvety can
          typically produce only account and membership metadata, policy
          acceptance records, billing metadata Helvety holds, and opaque
          ciphertext. Helvety cannot decrypt or produce encrypted workspace
          plaintext. For helvety.com public tools, Helvety generally holds only
          technical metadata (for example IP addresses, timestamps, and download
          records), not user profiles. Abuse and law-enforcement contact details
          are in the{" "}
          <a
            href="/impressum#abuse"
            className="hover:text-foreground underline transition-colors"
          >
            Impressum (Abuse)
          </a>
          .
        </p>
        <p className="text-muted-foreground text-sm">
          Helvety is the controller of Helvety Cloud account, authentication,
          invitation, and billing metadata described in the Privacy Policy. For
          end-to-end encrypted workspace content, Helvety stores ciphertext it
          cannot read and is not a controller of that plaintext. Customers who
          need a written processor agreement for account metadata may use the{" "}
          <a
            href="/dpa"
            className="hover:text-foreground underline transition-colors"
          >
            Helvety Cloud Data Processing Addendum (metadata)
          </a>
          .
        </p>
      </section>

      <section id="ip" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          11. Intellectual Property and Source
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
          12. Disclaimers and Liability
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services are provided &quot;as is&quot; and &quot;as
          available,&quot; without warranties of any kind to the fullest extent
          permitted by Swiss law. We do not warrant fitness for a particular
          purpose, merchantability, non-infringement, or that results (including
          OCR text or PDF edits) will be accurate or complete. Helvety does not
          warrant that encrypted Helvety Cloud data will remain recoverable if
          you lose unlock or recovery material, or that third-party browsers, OS
          passkey stores, or devices will always remain compatible.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          To the fullest extent permitted by law, Helvety by Rubin and Caspar
          Camille Rubin (as sole proprietor) are not liable for indirect,
          incidental, special, consequential, or punitive damages, or loss of
          data, profits, revenue, goodwill, or business, arising from use of the
          Services, including permanent loss of Helvety Cloud data due to lost
          keys or recovery material. Our aggregate liability for claims relating
          to the Services is limited to CHF 0 for free offerings, or the greater
          of CHF 100 or the amounts you paid Helvety for the Service in the
          twelve (12) months before the claim. Nothing excludes liability that
          cannot be limited under mandatory Swiss law (or other mandatory
          consumer protections that apply to you), including liability for death
          or personal injury caused by negligence where such limitation is
          prohibited, or for fraud or willful misconduct.
        </p>
        <p className="text-muted-foreground text-sm">
          You will defend and indemnify Helvety against claims, damages, and
          reasonable costs arising from your unlawful use of the Services, your
          encrypted content, or your breach of these Terms, except to the extent
          caused by Helvety&apos;s willful misconduct.
        </p>
      </section>

      <section id="governing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">13. Governing Law</h2>
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
        <h2 className="mb-4 text-xl font-semibold">14. Changes</h2>
        <p className="text-muted-foreground text-sm">
          We may update these Terms by posting a revised version on this page.
          Continued use after the &quot;Last reviewed&quot; date means you
          accept the updated Terms for public tools. For Helvety Cloud, material
          changes may require acceptance of a new version string before
          continued use of encrypted features.
        </p>
      </section>

      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">15. Contact</h2>
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
