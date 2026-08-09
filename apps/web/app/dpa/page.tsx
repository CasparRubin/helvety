import { CONTACT_EMAIL, urls } from "@helvety/shared/config";

import "@/app/legal.css";
import {
  LegalFooterNote,
  LegalHeader,
  LegalPageShell,
  LegalToc,
} from "@/components/legal-document";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud Data Processing Addendum (metadata)",
  description:
    "Helvety Cloud DPA for account and billing metadata under Swiss nDSG Art. 9",
  alternates: {
    canonical: `${urls.home}/dpa`,
  },
};

/** Metadata-only DPA for Helvety Cloud (ungated; not ciphertext). */
export default function DpaPage() {
  return (
    <LegalPageShell>
      <LegalHeader
        title="Helvety Cloud Data Processing Addendum (metadata)"
        lastReviewed="August 9, 2026"
        subtitle="Swiss nDSG Art. 9 processor terms for account metadata only"
      />

      <section className="legal-section">
        <p className="text-muted-foreground text-sm">
          This Data Processing Addendum (&quot;DPA&quot;) applies when a
          customer organization (&quot;Customer&quot;) uses Helvety Cloud and
          Helvety by Rubin (&quot;Helvety&quot;) processes personal data in
          account, authentication, invitation, policy-acceptance, or billing
          metadata on Customer&apos;s documented instructions. It does{" "}
          <strong className="text-foreground">not</strong> apply to end-to-end
          encrypted workspace content Helvety cannot decrypt. Related:{" "}
          <a
            href="/privacy"
            className="hover:text-foreground underline transition-colors"
          >
            Privacy Policy
          </a>
          ,{" "}
          <a
            href="/terms"
            className="hover:text-foreground underline transition-colors"
          >
            Terms of Service
          </a>
          .
        </p>
      </section>

      <LegalToc>
        <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
        <ol className="text-muted-foreground list-outside list-decimal space-y-1 pl-5 text-sm">
          <li>
            <a
              href="#roles"
              className="hover:text-foreground transition-colors"
            >
              Roles
            </a>
          </li>
          <li>
            <a
              href="#scope"
              className="hover:text-foreground transition-colors"
            >
              Scope of processing
            </a>
          </li>
          <li>
            <a
              href="#instructions"
              className="hover:text-foreground transition-colors"
            >
              Instructions
            </a>
          </li>
          <li>
            <a
              href="#security"
              className="hover:text-foreground transition-colors"
            >
              Security
            </a>
          </li>
          <li>
            <a
              href="#subprocessors"
              className="hover:text-foreground transition-colors"
            >
              Subprocessors
            </a>
          </li>
          <li>
            <a
              href="#assistance"
              className="hover:text-foreground transition-colors"
            >
              Assistance and breaches
            </a>
          </li>
          <li>
            <a
              href="#deletion"
              className="hover:text-foreground transition-colors"
            >
              Return and deletion
            </a>
          </li>
          <li>
            <a
              href="#governing"
              className="hover:text-foreground transition-colors"
            >
              Governing law
            </a>
          </li>
        </ol>
      </LegalToc>

      <section id="roles" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">1. Roles</h2>
        <p className="text-muted-foreground text-sm">
          For the metadata in scope, Customer is the controller and Helvety is
          the processor under Art. 9 of the Swiss Federal Act on Data Protection
          (nDSG), to the extent Customer determines the purposes and means of
          that processing. Helvety remains controller of its own account
          operations where it alone determines purposes (for example product
          security logs and Helvety&apos;s own billing records), as described in
          the Privacy Policy. Helvety is not a processor of encrypted workspace
          plaintext it cannot access.
        </p>
      </section>

      <section id="scope" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">2. Scope of processing</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Subject matter: operating Helvety Cloud for Customer&apos;s authorized
          users. Duration: while the relevant Cloud accounts and workspaces
          exist and for retention described in the Privacy Policy. Nature:
          storage, transmission, and support for metadata Helvety holds.
          Categories of data subjects: Customer&apos;s users and invitees.
          Categories of personal data: email addresses, authentication and
          membership metadata, policy acceptance records, invitation metadata,
          billing identity and subscription status, and technical logs
          reasonably needed to operate the Service. Not in scope: titles,
          bodies, filenames, file bytes, or other workspace plaintext that
          remains ciphertext.
        </p>
      </section>

      <section id="instructions" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">3. Instructions</h2>
        <p className="text-muted-foreground text-sm">
          Helvety processes in-scope metadata only on Customer&apos;s documented
          instructions, including use of Helvety Cloud, the Terms, this DPA, and
          configuration in the product (for example invitations and billing).
          Helvety informs Customer if an instruction appears to violate Swiss
          data protection law. Helvety may process as required by Swiss law;
          Helvety will inform Customer of such a legal requirement unless
          prohibited.
        </p>
      </section>

      <section id="security" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. Security</h2>
        <p className="text-muted-foreground text-sm">
          Helvety implements appropriate technical and organizational measures
          for the Service, including TLS in transit, access controls, separation
          of encryption unlock from session auth, and end-to-end encryption of
          workspace content on user devices. Helvety ensures persons authorized
          to process metadata are bound to confidentiality.
        </p>
      </section>

      <section id="subprocessors" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">5. Subprocessors</h2>
        <p className="text-muted-foreground text-sm">
          Customer authorizes Helvety to engage the infrastructure processors
          listed in the Privacy Policy{" "}
          <a
            href="/privacy#subprocessors"
            className="hover:text-foreground underline transition-colors"
          >
            subprocessors section
          </a>{" "}
          (including Supabase in Zurich, Vercel, Stripe, and email delivery used
          for auth). Helvety remains responsible for subprocessors under Art. 9
          nDSG. Material changes to that list are published on the Privacy
          Policy page.
        </p>
      </section>

      <section id="assistance" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          6. Assistance and breaches
        </h2>
        <p className="text-muted-foreground text-sm">
          Taking into account the nature of processing, Helvety assists Customer
          with data subject requests and security obligations for in-scope
          metadata Helvety holds. Helvety cannot produce encrypted workspace
          plaintext. Helvety notifies Customer without undue delay after
          becoming aware of a personal data breach affecting in-scope metadata,
          and cooperates on information reasonably needed for Customer&apos;s
          notification duties.
        </p>
      </section>

      <section id="deletion" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">7. Return and deletion</h2>
        <p className="text-muted-foreground text-sm">
          On account closure or written request, Helvety deletes or returns
          in-scope metadata as described in the Privacy Policy and product
          deletion flows, except where Swiss law requires longer retention (for
          example accounting). Shared workspaces with remaining members are not
          wiped for those members when one user leaves or deletes their account.
        </p>
      </section>

      <section id="governing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">8. Governing law</h2>
        <p className="text-muted-foreground text-sm">
          This DPA is governed by the substantive laws of Switzerland. Exclusive
          jurisdiction is Basel-Stadt, Switzerland, except where mandatory law
          provides otherwise. Questions:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <LegalFooterNote>
        <p className="text-muted-foreground text-center text-xs">
          This DPA covers Helvety Cloud metadata only. It does not create an
          offer of the Services in the EU/EEA.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
