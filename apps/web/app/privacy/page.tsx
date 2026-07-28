import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import {
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
} from "@helvety/shared/power-platform-configurator-copy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@helvety/ui/table";

import "@/app/legal.css";
import {
  LegalFooterNote,
  LegalHeader,
  LegalPageShell,
  LegalTable,
  LegalTableWrap,
  LegalToc,
} from "@/components/legal-document";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Helvety - How we handle your data",
  alternates: {
    canonical: `${urls.home}/privacy`,
  },
};

/** Privacy Policy page for Helvety */
export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Privacy Policy" lastReviewed="July 28, 2026" />

      <section className="legal-section">
        <p className="text-muted-foreground text-sm">
          Helvety by Rubin (&quot;we,&quot; &quot;us,&quot; or &quot;the
          Company&quot;) explains how we handle information when you use
          helvety.com, helvety.cloud, and related Helvety products (&quot;the
          Services&quot;). This notice is based primarily on the Swiss Federal
          Act on Data Protection (nDSG / FADP). We focus on customers in
          Switzerland and do not offer the Services in the EU/EEA. Where
          mandatory law elsewhere applies in a specific case, we follow those
          obligations.
        </p>
        <p className="text-muted-foreground text-sm">
          helvety.com public browser tools and the Store do not require a
          Helvety account. Helvety Cloud (helvety.cloud) does: email one-time
          codes for sign-in, and separate device unlock for end-to-end
          encryption. Encrypted workspace content is opaque to Helvety.
        </p>
      </section>

      <LegalToc>
        <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
        <ol className="text-muted-foreground list-outside list-decimal space-y-1 pl-5 text-sm">
          <li>
            <a
              href="#controller"
              className="hover:text-foreground transition-colors"
            >
              Data Controller
            </a>
          </li>
          <li>
            <a
              href="#services"
              className="hover:text-foreground transition-colors"
            >
              Services and Processing
            </a>
          </li>
          <li>
            <a
              href="#data-collected"
              className="hover:text-foreground transition-colors"
            >
              What We Collect
            </a>
          </li>
          <li>
            <a
              href="#how-we-use"
              className="hover:text-foreground transition-colors"
            >
              How We Use Information
            </a>
          </li>
          <li>
            <a
              href="#subprocessors"
              className="hover:text-foreground transition-colors"
            >
              Processors and Subprocessors
            </a>
          </li>
          <li>
            <a
              href="#retention"
              className="hover:text-foreground transition-colors"
            >
              Retention
            </a>
          </li>
          <li>
            <a
              href="#your-rights"
              className="hover:text-foreground transition-colors"
            >
              Your Rights
            </a>
          </li>
          <li>
            <a
              href="#cookies"
              className="hover:text-foreground transition-colors"
            >
              Cookies and Local Storage
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

      <section id="controller" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">1. Data Controller</h2>
        <p className="text-muted-foreground text-sm">
          Helvety by Rubin (Caspar Camille Rubin), Holeestrasse 116, 4054 Basel,
          Switzerland. UID CHE-356.266.592. Email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section id="services" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          2. Services and Processing
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          This notice covers helvety.com marketing and legal pages, Helvety
          Store, the public browser tools below, Helvety Cloud at helvety.cloud,
          and separately distributed desktop or Microsoft 365 products that link
          here.
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">
              Helvety PDF (helvety.com/pdf):
            </strong>{" "}
            Merge, reorder, rotate, extract, and related supported actions keep
            file contents inside your browser under the current architecture.
            Nothing is uploaded to our servers for conversion.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Image Editor (helvety.com/image-editor):
            </strong>{" "}
            Annotation and export workflows run locally in your browser under
            the current architecture. Image files are not uploaded to our
            servers for processing.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety OCR (helvety.com/ocr):
            </strong>{" "}
            Text extraction runs locally in your browser under the current
            architecture with on-device optical character recognition. Files are
            not uploaded to our servers for processing.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Store (helvety.com/store):
            </strong>{" "}
            Catalog browsing and public package downloads work without
            registration. We may process IP address and related technical
            metadata for security, rate limiting, and abuse prevention.
          </li>
          <li>
            <strong className="text-foreground">
              Power Platform Configurator:
            </strong>{" "}
            {POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}{" "}
            {POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX} The extension reads
            supported flow/run URLs and accesses model-driven form UI objects
            locally only to apply the selected behavior. Preferences stay in
            browser storage. The extension does not send tab URLs, form content,
            or preferences to Helvety servers. Your browser and sync provider
            may process stored preferences under their own terms.
          </li>
          <li>
            <strong className="text-foreground">Helvety SPO Explorer:</strong>{" "}
            SharePoint Framework package distributed via the Store. Runs in your
            Microsoft 365 tenant under Microsoft&apos;s hosting and your
            organization&apos;s policies.
          </li>
          <li>
            <strong className="text-foreground">Helvety Screen Tools:</strong>{" "}
            Windows desktop app distributed outside this monorepo. Screenshot
            and annotation content stays on your device in normal operation.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Cloud (helvety.cloud):
            </strong>{" "}
            Passwordless, end-to-end encrypted workspace service. Sign-in uses
            email one-time codes. Encryption unlock and decryption happen only
            on your device (WebAuthn PRF / passkey and related client-held
            material). Helvety stores account metadata and opaque ciphertext. It
            cannot decrypt workspace content and does not hold a master key.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            AI model training and retention statement:
          </strong>{" "}
          We do not use files you open in Helvety PDF, Helvety Image Editor, or
          Helvety OCR to train AI models. Under the current architecture those
          tools keep content on your device and only use minimal server-side
          endpoints for platform and security functions (for example CSP
          reporting). We also do not use Helvety Cloud ciphertext or decrypted
          workspace content to train AI models.
        </p>
      </section>

      <section id="data-collected" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">3. What We Collect</h2>
        <h3 className="mb-3 text-lg font-medium">
          3.1 helvety.com and public tools
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Because there is no helvety.com account, we do not maintain user
          profiles or passwords for public tools on our servers.
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Technical metadata:</strong> IP
            address and request timestamps from standard web server and hosting
            logs, plus security signals needed for rate limiting and abuse
            prevention (including Store downloads). We do not use third-party
            analytics on our web Services and do not build navigation or usage
            profiles of visitors.
          </li>
          <li>
            <strong className="text-foreground">Support messages:</strong>{" "}
            Whatever you choose to send when you email us.
          </li>
          <li>
            <strong className="text-foreground">On-device preferences:</strong>{" "}
            Theme and tool UI settings stored in your browser (see Cookies and
            Local Storage).
          </li>
        </ul>
        <h3 className="mb-3 text-lg font-medium">
          3.2 Helvety Cloud account and metadata
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          When you use Helvety Cloud, Helvety processes:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Email address and authentication metadata (for example OTP delivery
            via Supabase Auth).
          </li>
          <li>
            Profile and membership records (user id, workspace membership,
            timestamps).
          </li>
          <li>
            Public cryptographic material needed for the product (for example
            user public keys) and wrapped or encrypted blobs that Helvety cannot
            decrypt.
          </li>
          <li>
            Policy acceptance records (which policy versions you accepted and
            when), including geographic eligibility acknowledgment.
          </li>
          <li>
            Technical logs reasonably needed to operate and secure the Service
            (for example IP addresses in hosting/auth logs, request metadata).
          </li>
          <li>
            Billing metadata when you use paid plans (for example subscription
            status and meter counts). Billing never includes encrypted plaintext
            or raw encryption keys.
          </li>
        </ul>
        <h3 className="mb-3 text-lg font-medium">
          3.3 Data Helvety cannot access
        </h3>
        <p className="text-muted-foreground text-sm">
          Encrypted Helvety Cloud content (ciphertext) is opaque to Helvety.
          Staff, database administrators, and privileged database roles cannot
          decrypt titles, bodies, files, or other plaintext from your encrypted
          data. Helvety does not receive PRF output, unlock keys, recovery key
          plaintext, or raw private keys. Helvety cannot restore your data if
          you lose unlock or recovery material. Helvety is not a controller of
          plaintext it cannot access.
        </p>
      </section>

      <section id="how-we-use" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          4. How We Use Information
        </h2>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            Operate and secure helvety.com, Helvety Store, Helvety PDF, Helvety
            Image Editor, Helvety OCR, and related public pages (local-only
            browser file tools under the current architecture).
          </li>
          <li>
            Provide and secure Helvety Cloud: authenticate you, manage accounts
            and workspaces, store ciphertext and related metadata, and record
            policy acceptances.
          </li>
          <li>
            Deliver public package downloads, apply rate limits, and investigate
            abuse.
          </li>
          <li>
            Bill and account for paid Helvety Cloud plans (contract / legal
            obligation).
          </li>
          <li>
            Respond to support and legal requests you or authorities send,
            limited to data Helvety actually holds.
          </li>
          <li>
            Meet Swiss legal, tax, and accounting duties where records are
            required.
          </li>
        </ul>
      </section>

      <section id="subprocessors" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Processors and Subprocessors
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We use infrastructure providers to host and protect the Services.
          Typical categories include:
        </p>
        <LegalTableWrap ariaLabel="Infrastructure processors">
          <LegalTable layout="scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Hosting / CDN</TableCell>
                  <TableCell>
                    Serve helvety.com zones, helvety.cloud, and static assets
                    (currently Vercel)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Auth / database (Cloud)</TableCell>
                  <TableCell>
                    Supabase: authentication and Postgres for Helvety Cloud in
                    Zurich (eu-central-2). Processes account email/auth metadata
                    and ciphertext/metadata as described above.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Email (Cloud auth)</TableCell>
                  <TableCell>
                    OTP and auth emails via Supabase Auth. Region depends on
                    vendor email configuration.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payments (Cloud)</TableCell>
                  <TableCell>
                    Stripe: billing identity and payment metadata for Pro
                    Workspace and add-ons. Never encrypted plaintext or raw
                    encryption keys.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rate limiting</TableCell>
                  <TableCell>
                    Distributed limits for Store downloads (currently Upstash
                    Redis)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Package delivery</TableCell>
                  <TableCell>
                    GitHub Releases (or equivalent) for public .sppkg downloads
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Chrome Web Store</TableCell>
                  <TableCell>
                    Distribution of Power Platform Configurator by Google
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </LegalTable>
        </LegalTableWrap>
        <p className="text-muted-foreground mt-4 text-sm">
          Primary Helvety Cloud database and auth are hosted in Switzerland
          (Zurich). Hosting and email tooling may involve processing in other
          regions depending on vendor configuration. Where required, Helvety
          relies on appropriate transfer mechanisms offered by those vendors
          (for example standard contractual clauses) and contractual safeguards.
        </p>
        <p className="text-muted-foreground mt-4 text-sm">
          Microsoft 365, SharePoint / Power Platform runtimes, browser vendors,
          and Windows operate under their own terms when you use SPO Explorer,
          Power Platform Configurator, or Screen Tools. We do not sell personal
          data. This subprocessors list may change; material changes will be
          reflected on this page.
        </p>
      </section>

      <section id="retention" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">6. Retention</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Hosting and security logs are kept only as long as needed for
          operations, abuse handling, and legal holds (typically up to about 6
          months for routine security metadata under current policy). Contract
          or accounting evidence may be kept longer where Swiss law requires it
          (for example up to 10 years). Browser-local files and preferences
          remain on your device until you clear them.
        </p>
        <p className="text-muted-foreground text-sm">
          For Helvety Cloud: account and membership data are kept while your
          account is active and for a reasonable period afterward as needed for
          security, dispute handling, and legal retention. Ciphertext and
          related encryption metadata are kept while associated with your
          account or workspaces, or until deleted via the Service or account
          closure. Account closure deletes workspaces where you are the only
          member (including your Personal workspace) and their ciphertext.
          Shared workspaces with other members are not wiped for those members.
          Policy acceptance records are retained to evidence which terms
          applied.
        </p>
      </section>

      <section id="your-rights" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">7. Your Rights</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Under the Swiss nDSG you may request access, correction, deletion, or
          restriction of personal data we hold, and object to certain
          processing, subject to legal exceptions. Contact{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          . Helvety may need to verify your identity. Helvety cannot produce
          encrypted plaintext it never held.
        </p>
        <p className="text-muted-foreground text-sm">
          For helvety.com public tools there is no self-service export or
          deletion dashboard; we generally hold only technical metadata and any
          messages you sent us. For Helvety Cloud, erasure of account data does
          not recreate lost encryption keys. Deleting ciphertext removes stored
          blobs; it does not mean Helvety ever held plaintext. You may lodge a
          complaint with the Swiss FDPIC or another competent supervisory
          authority where applicable. The Service is not directed to children
          under 16.
        </p>
      </section>

      <section id="cookies" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          8. Cookies and Local Storage
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We do not operate third-party analytics, advertising trackers, or
          cross-site profiling on helvety.com. Preference storage is kept in
          your browser so theme and tool UI settings survive reloads. Helvety
          Cloud may also use session cookies or similar storage required for
          authentication and product operation (for example Supabase Auth
          session), separate from encryption unlock material which stays on your
          device.
        </p>
        <LegalTableWrap ariaLabel="Cookies and local storage">
          <LegalTable layout="cards">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cookie / Storage</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell data-label="Cookie / Storage">
                    Theme preference (localStorage)
                  </TableCell>
                  <TableCell data-label="Purpose">
                    Remember light or dark theme
                  </TableCell>
                  <TableCell data-label="Domain">helvety.com zones</TableCell>
                  <TableCell data-label="Duration">Until cleared</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell data-label="Cookie / Storage">
                    helvety-pdf-columns (localStorage)
                  </TableCell>
                  <TableCell data-label="Purpose">
                    Remember PDF tool column layout
                  </TableCell>
                  <TableCell data-label="Domain">helvety.com/pdf</TableCell>
                  <TableCell data-label="Duration">Until cleared</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </LegalTable>
        </LegalTableWrap>
      </section>

      <section id="changes" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">9. Changes</h2>
        <p className="text-muted-foreground text-sm">
          We may update this Privacy Policy when the Services change. The
          &quot;Last reviewed&quot; date at the top shows the latest review.
          Material changes will be reflected on this page. For Helvety Cloud,
          material changes that affect signup-gated acceptance use a new version
          string you must accept before continued encryption setup or use where
          gated.
        </p>
      </section>

      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">10. Contact</h2>
        <p className="text-muted-foreground text-sm">
          Privacy questions:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          . Related:{" "}
          <a
            href="/terms"
            className="hover:text-foreground underline transition-colors"
          >
            Terms of Service
          </a>
          ,{" "}
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
          By using Helvety services, you acknowledge this Privacy Policy.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
