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
          helvety.com and related Helvety products (&quot;the Services&quot;).
          This notice is based primarily on the Swiss Federal Act on Data
          Protection (nDSG). We focus on customers in Switzerland and do not
          actively target EU/EEA markets. Where mandatory law elsewhere applies
          in a specific case, we follow those obligations.
        </p>
        <p className="text-muted-foreground text-sm">
          Helvety does not offer user accounts or login on helvety.com. Public
          browser tools process files on your device. The Store catalog and
          package downloads do not require registration.
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
              Services and Local Processing
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
              href="#third-parties"
              className="hover:text-foreground transition-colors"
            >
              Processors and Third Parties
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
          Switzerland. Email:{" "}
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
          2. Services and Local Processing
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          This notice covers helvety.com marketing and legal pages, Helvety
          Store, and the public browser tools below. Separately distributed
          desktop or Microsoft 365 products may also link here. Helvety Cloud
          (helvety.cloud) is a separate product with its own privacy policy,
          terms, and LICENSE; it is not governed by this notice.
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
        </ul>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            AI model training and retention statement:
          </strong>{" "}
          We do not use files you open in Helvety PDF, Helvety Image Editor, or
          Helvety OCR to train AI models. Under the current architecture those
          tools keep content on your device and only use minimal server-side
          endpoints for platform and security functions (for example CSP
          reporting).
        </p>
      </section>

      <section id="data-collected" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">3. What We Collect</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Because there is no helvety.com account, we do not maintain user
          profiles, passwords, or encrypted vaults on our servers.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
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
            Deliver public package downloads, apply rate limits, and investigate
            abuse.
          </li>
          <li>
            Respond to support and legal requests you or authorities send.
          </li>
          <li>
            Meet Swiss legal, tax, and accounting duties where records are
            required.
          </li>
        </ul>
      </section>

      <section id="third-parties" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Processors and Third Parties
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
                    Serve helvety.com zones and static assets (currently Vercel)
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
          Microsoft 365, SharePoint / Power Platform runtimes, browser vendors,
          and Windows operate under their own terms when you use SPO Explorer,
          Power Platform Configurator, or Screen Tools. We do not sell personal
          data.
        </p>
      </section>

      <section id="retention" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">6. Retention</h2>
        <p className="text-muted-foreground text-sm">
          Hosting and security logs are kept only as long as needed for
          operations, abuse handling, and legal holds (typically up to about 6
          months for routine security metadata under current policy). Contract
          or accounting evidence may be kept longer where Swiss law requires it
          (for example up to 10 years). Browser-local files and preferences
          remain on your device until you clear them.
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
          . Because there is no account, there is no self-service export or
          deletion dashboard. We generally hold only technical metadata and any
          messages you sent us.
        </p>
      </section>

      <section id="cookies" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          8. Cookies and Local Storage
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We do not operate third-party analytics, advertising trackers, or
          cross-site profiling on helvety.com. Preference storage is kept in
          your browser so theme and tool UI settings survive reloads.
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
          Material changes will be reflected on this page.
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
