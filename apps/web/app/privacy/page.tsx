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
  title: "Privacy Policy | Helvety",
  description: "Privacy Policy for Helvety - How we handle your data",
  alternates: {
    canonical: `${urls.home}/privacy`,
  },
};

/** Privacy Policy page for Helvety */
export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Privacy Policy" lastReviewed="April 4, 2026" />

      {/* Introduction */}
      <section className="legal-section">
        <p className="text-muted-foreground text-sm">
          Helvety by Rubin (&quot;we,&quot; &quot;us,&quot; or &quot;the
          Company&quot;) respects your privacy and takes the protection of your
          personal data seriously. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use Helvety
          services (&quot;the Services&quot;). This policy complies with the
          Swiss Federal Act on Data Protection (nDSG) and other applicable data
          protection laws.
        </p>
        <p className="text-muted-foreground text-sm">
          Our services are primarily intended for customers located in
          Switzerland. Sign-in includes a location attestation step where users
          confirm they are not located in the EU/EEA before verification-code
          delivery. Access from outside Switzerland may still occur. This
          Privacy Policy is primarily based on the Swiss Federal Act on Data
          Protection (nDSG). Where mandatory law in another jurisdiction applies
          in a specific case, we comply with applicable legal obligations.
        </p>
      </section>

      {/* Table of Contents */}
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
              href="#data-collected"
              className="hover:text-foreground transition-colors"
            >
              Data We Collect
            </a>
          </li>
          <li>
            <a
              href="#legal-basis"
              className="hover:text-foreground transition-colors"
            >
              Legal Basis for Processing
            </a>
          </li>
          <li>
            <a
              href="#how-we-use"
              className="hover:text-foreground transition-colors"
            >
              How We Use Your Data
            </a>
          </li>
          <li>
            <a
              href="#third-parties"
              className="hover:text-foreground transition-colors"
            >
              Third-Party Service Providers
            </a>
          </li>
          <li>
            <a
              href="#data-transfers"
              className="hover:text-foreground transition-colors"
            >
              International Data Transfers
            </a>
          </li>
          <li>
            <a
              href="#retention"
              className="hover:text-foreground transition-colors"
            >
              Data Retention
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
              Cookies and Tracking
            </a>
          </li>
          <li>
            <a
              href="#security"
              className="hover:text-foreground transition-colors"
            >
              Security Measures
            </a>
          </li>
          <li>
            <a
              href="#children"
              className="hover:text-foreground transition-colors"
            >
              Children&apos;s Privacy
            </a>
          </li>
          <li>
            <a
              href="#changes"
              className="hover:text-foreground transition-colors"
            >
              Changes to This Policy
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="hover:text-foreground transition-colors"
            >
              Contact Information
            </a>
          </li>
        </ol>
      </LegalToc>

      {/* Section 1 */}
      <section id="controller" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">1. Data Controller</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The data controller responsible for your personal data is:
        </p>
        <address className="text-muted-foreground mb-4 text-sm not-italic">
          <strong className="text-foreground">Helvety by Rubin</strong>
          <br />
          Holeestrasse 116
          <br />
          4054 Basel
          <br />
          Switzerland
          <br />
          <br />
          Email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <br />
          Phone:{" "}
          <a
            href="tel:+41798700208"
            className="hover:text-foreground underline transition-colors"
          >
            +41 79 870 02 08
          </a>
        </address>
        <p className="text-muted-foreground text-sm">
          For any privacy-related inquiries or to exercise your data protection
          rights, please contact us at the above address.
        </p>
      </section>

      {/* Section 2 */}
      <section id="data-collected" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">2. Data We Collect</h2>

        <h3 className="mb-3 text-lg font-medium">2.1 Account Information</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          When you create an account, we collect your email address for
          authentication purposes. We use a secure authentication process: new
          users must first confirm that they are not located in the EU/EEA
          before verification-code delivery. Limited technical and security data
          (for example, anti-abuse/rate-limit data) may be processed before
          account creation. After this confirmation, verification codes
          (numeric, typically 6–8 digits per service configuration) are sent by
          email, and OTP verification is followed by one passkey step (setup for
          first-time users or sign-in verification for existing users). We
          store:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Your email address (used for authentication and account recovery)
          </li>
          <li>A unique internal identifier (UUID) generated automatically</li>
          <li>
            Passkey credentials (public key and metadata for authentication)
          </li>
          <li>
            Encryption passkey parameters (PRF salt values for deriving
            encryption keys, plus key-check values used to verify derived-key
            correctness, for Helvety Tasks, Helvety Contacts, and Helvety Notes
            which use end-to-end encryption)
          </li>
          <li>
            Location-attestation metadata (confirmation that you are not located
            in the EU/EEA, and the timestamp of that confirmation)
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Your email address is used primarily for authentication (verification
          codes and passkey-bound sign-in), account recovery, and important
          account notifications. We do not share your email with third parties
          for marketing purposes, except where required by law or described in
          this Privacy Policy.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          2.2 Product Access and Download Data
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          When you access products or request package downloads, we collect:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Operational records related to product access and download requests
          </li>
          <li>Product and package identifiers</li>
          <li>
            Security and abuse-prevention metadata (for example IP address)
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          2.3 Technical and Usage Data
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We automatically collect certain information when you use the
          Services:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Device information</li>
          <li>Pages visited and high-level interaction events</li>
          <li>Date and time of access</li>
          <li>Referring website</li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">2.4 Communication Data</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          If you contact us, we collect the information you provide in your
          communication, including your email address and message content.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          2.5 Extension and packaged software usage
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          For Helvety extensions and other installable packages offered through
          the Store (including SharePoint Framework solutions and browser
          extensions), functionality runs in your SharePoint tenant or on your
          device. Helvety may still process limited technical data to operate
          the Store, deliver downloads, and maintain reliability. Microsoft 365,
          Power Automate, or your browser vendor may process additional data
          under their own terms. This data:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Is primarily technical context needed for extension operation</li>
          <li>Supports extension functionality and reliability</li>
          <li>Is processed in accordance with this Privacy Policy</li>
          <li>
            Is cached locally to minimize API calls and ensure offline
            reliability
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          2.6 Data Provision Requirements
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We inform you about whether providing personal data is a statutory or
          contractual requirement:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Account Creation:</strong>{" "}
            Creating an account requires your email address (for verification
            codes when signing up or recovering access) and passkey setup using
            your device&apos;s biometrics (Face ID, fingerprint, or PIN). Your
            email is necessary for account verification and recovery. A unique
            identifier is generated automatically.
          </li>
          <li>
            <strong className="text-foreground">Product Access:</strong> When
            you request product access or package downloads, we process the
            minimum technical metadata required for provisioning, delivery, and
            abuse prevention.
          </li>
          <li>
            <strong className="text-foreground">Extension use:</strong> Certain
            technical context may be needed for SharePoint-hosted extensions,
            browser extensions, or related packaged software.
          </li>
          <li>
            <strong className="text-foreground">Communication:</strong>{" "}
            Providing contact information when you reach out to us is voluntary
            but necessary if you wish to receive a response.
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">2.7 Encryption Data</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety Tasks, Helvety Contacts, and Helvety Notes use end-to-end
          encryption to protect your data. For these services, we store:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            PRF parameters (Pseudo-Random Function extension data), including
            PRF salt and key-check values, used to derive and verify encryption
            keys from your passkey
          </li>
          <li>Encrypted data fields (where applicable)</li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Important:</strong> Encryption
          keys are derived client-side in your browser using the WebAuthn PRF
          extension. Helvety does not receive or store your raw decryption keys
          during normal operation. This architecture is intended to reduce
          exposure risk if our servers are compromised, but no technical measure
          can provide absolute protection. Additionally, encryption uses
          Additional Authenticated Data (AAD) to bind each ciphertext to its
          specific database record, helping prevent encrypted data from being
          moved or replayed in a different context.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Browser Requirements:</strong>{" "}
          End-to-end encryption requires a modern browser with WebAuthn PRF
          support. Browser compatibility can change over time; refer to the
          current product documentation for supported platforms.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          2.8 Data Processing by Service
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The Helvety ecosystem consists of several services, each with distinct
          data processing characteristics:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">
              helvety.com (Main Website):
            </strong>{" "}
            Uses essential cookies and privacy-focused telemetry (Vercel
            Analytics and Vercel Speed Insights). Speed Insights is currently
            enabled on helvety.com. We do not use advertising trackers or
            cross-site profiling.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Auth (helvety.com/auth):
            </strong>{" "}
            Email address, passkey credentials, PRF encryption parameters,
            location-attestation status (confirmation that you are not located
            in the EU/EEA and the timestamp of that confirmation), IP address
            (for rate limiting), and user agent (for device detection). This
            data is primarily used for authentication and security, and may also
            be processed where necessary for legal compliance, abuse prevention,
            and service reliability.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety PDF (helvety.com/pdf):
            </strong>{" "}
            For supported operations in the current architecture, file contents
            are processed in your browser and are not intended to be uploaded to
            our servers for file conversion. No login or account is required.
            The service still uses minimal server-side endpoints for platform
            and security functions (for example CSP reporting and
            session/security proxy logic). The service is provided free of
            charge; technical safeguards may still apply for security and
            operational stability.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Store (helvety.com/store):
            </strong>{" "}
            You can browse the catalog and use public package downloads without
            an account. We may still process IP address and related technical
            metadata for security, rate limiting, and abuse prevention. When you
            are signed in, we may also process user profile (email) and
            product/access records.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Tasks (helvety.com/tasks):
            </strong>{" "}
            Task content is end-to-end encrypted client-side before storage.
            Encrypted fields include: titles, descriptions, and start/end dates.
            These fields are designed to be stored as encrypted ciphertext at
            rest on our servers. Encryption keys are derived from your passkey
            on your device and are not transmitted to Helvety servers. Record
            identifiers for encrypted data are generated on your device and
            bound to the ciphertext via Additional Authenticated Data (AAD). Our
            architecture is designed so that we are generally unable to access
            your task content in plaintext during normal operation.
            Non-encrypted structural metadata is stored in plaintext to enable
            application functionality: record identifiers, timestamps, priority
            levels, display preferences (sort orders), and entity relationships
            (e.g., stage and label references). Business/account quotas are not
            applied.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Contacts (helvety.com/contacts):
            </strong>{" "}
            Contact content is end-to-end encrypted client-side before storage.
            Encrypted fields include: first and last names, description, email,
            phone, birthday, and notes. These fields are designed to be stored
            as encrypted ciphertext at rest on our servers. Encryption keys are
            derived from your passkey on your device and are not transmitted to
            Helvety servers. Record identifiers for encrypted data are generated
            on your device and bound to the ciphertext via Additional
            Authenticated Data (AAD). Our architecture is designed so that we
            are generally unable to access your contact content in plaintext
            during normal operation. Non-encrypted structural metadata is stored
            in plaintext to enable application functionality: record
            identifiers, timestamps, display preferences (sort orders), and
            immutable built-in taxonomy references (category IDs). When linking
            contacts with task entities, additional non-encrypted relationship
            metadata (link identifiers, linked entity identifiers/types, and
            timestamps) is stored to enable the cross-app linking feature.
            Business/account quotas are not applied.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Notes (helvety.com/notes):
            </strong>{" "}
            Note content is end-to-end encrypted client-side before storage.
            Encrypted fields include: title and description. These fields are
            designed to be stored as encrypted ciphertext at rest on our
            servers. Encryption keys are derived from your passkey on your
            device and are not transmitted to Helvety servers. Record
            identifiers for encrypted data are generated on your device and
            bound to the ciphertext via Additional Authenticated Data (AAD). Our
            architecture is designed so that we are generally unable to access
            your note content in plaintext during normal operation.
            Non-encrypted structural metadata is stored in plaintext to enable
            application functionality: record identifiers, timestamps, and
            display preferences (sort order). When linking notes with tasks and
            contacts, additional non-encrypted relationship metadata (link
            identifiers, linked entity identifiers/types, and timestamps) is
            stored to enable cross-app linking. Business/account quotas are not
            applied.
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="legal-basis" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          3. Legal Basis for Processing
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We process your personal data in accordance with the principles set
          out in Art. 6 nDSG: lawfulness, proportionality, purpose limitation,
          transparency, accuracy, and data security. Our processing is based on
          the following grounds:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Contract performance:</strong>{" "}
            Processing necessary to fulfill our contractual obligations to you,
            including account provisioning, package download delivery, and
            providing the Services.
          </li>
          <li>
            <strong className="text-foreground">Legal obligations:</strong>{" "}
            Processing required to comply with applicable Swiss law, such as tax
            and accounting requirements (e.g., Art. 958f Swiss Code of
            Obligations).
          </li>
          <li>
            <strong className="text-foreground">Legitimate interests:</strong>{" "}
            Processing for our legitimate business interests, such as fraud
            prevention, security, and improving our Services, where such
            interests are not overridden by your rights.
          </li>
          <li>
            <strong className="text-foreground">Consent:</strong> Where you have
            given explicit consent, such as for marketing communications. You
            may withdraw consent at any time.
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="how-we-use" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. How We Use Your Data</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We use your personal data for the following purposes:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>To create and manage your account</li>
          <li>To process and fulfill product access and package downloads</li>
          <li>
            To send transactional emails (auth, security, and service notices)
          </li>
          <li>To provide customer support</li>
          <li>To detect and prevent fraud and security incidents</li>
          <li>To comply with legal obligations</li>
          <li>To improve and optimize the Services</li>
          <li>To enforce our Terms of Service</li>
          <li>
            To respond to valid legal requests from Swiss law enforcement and
            judicial authorities
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          4.1 Marketing Communications
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We intend to send marketing communications (such as newsletters,
          promotional offers, or product announcements) only where we have a
          valid legal basis, typically your consent where required by applicable
          law.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Opt-Out:</strong> You can withdraw
          your consent and unsubscribe from marketing communications at any time
          by:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Using the unsubscribe mechanism included in marketing communications
            where technically applicable
          </li>
          <li>Contacting us at {CONTACT_EMAIL}</li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Please note that even if you opt out of marketing communications, we
          may still send you transactional or service-related communications
          (such as account security notifications, authentication messages,
          access confirmations, or important service updates) as necessary to
          provide the Services.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          4.2 Law Enforcement and Legal Disclosures
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We may disclose your non-encrypted personal data to Swiss law
          enforcement or judicial authorities when required by a valid Swiss
          court order or binding legal request issued in accordance with
          applicable Swiss law. We will cooperate with any lawful surveillance
          order directed at us, including under the Swiss Federal Act on the
          Surveillance of Post and Telecommunications (BÜPF) to the extent it
          applies to our services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          The types of data we may disclose in response to valid legal requests
          include:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Account information (email address, account creation date, internal
            identifiers)
          </li>
          <li>IP addresses and timestamps associated with account activity</li>
          <li>Product access and download metadata</li>
          <li>
            Non-encrypted structural metadata from Helvety Tasks, Helvety
            Contacts, and Helvety Notes (priority levels, display preferences
            such as colors and icons, sort orders, entity relationships, and
            category assignments)
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Our architecture is designed so we are generally unable to access
            encryption keys for end-to-end encrypted content during normal
            operation.
          </strong>{" "}
          Decryption keys are designed to remain on your device. As a result, we
          are generally not able to provide plaintext encrypted content in
          response to legal requests. The data categories we can typically
          provide are limited to non-encrypted metadata as described above.
        </p>
        <p className="text-muted-foreground text-sm">
          Where legally permitted, we will notify affected users of legal
          requests concerning their accounts. We may be prohibited from
          providing such notice where it would compromise an ongoing
          investigation or where notification is otherwise prohibited by law.
        </p>
      </section>

      {/* Section 5 */}
      <section id="third-parties" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Third-Party Service Providers
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We share your personal data with the following third-party service
          providers who process data on our behalf:
        </p>

        <div className="legal-table-wrap mb-4 overflow-x-auto">
          <table className="border-border w-full border text-sm">
            <thead>
              <tr className="bg-card">
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Provider
                </th>
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Purpose
                </th>
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr>
                <td className="border-border border-b p-3">Vercel Inc.</td>
                <td className="border-border border-b p-3">
                  Website hosting, delivery, privacy-focused analytics, and
                  performance monitoring (Speed Insights on helvety.com)
                </td>
                <td className="border-border border-b p-3">USA</td>
              </tr>
              <tr>
                <td className="border-border border-b p-3">Supabase Inc.</td>
                <td className="border-border border-b p-3">
                  Database and authentication
                </td>
                <td className="border-border border-b p-3">USA</td>
              </tr>
              <tr>
                <td className="border-border border-b p-3">Resend Inc.</td>
                <td className="border-border border-b p-3">
                  Transactional email delivery (SMTP relay via Supabase)
                </td>
                <td className="border-border border-b p-3">USA</td>
              </tr>
              <tr>
                <td className="p-3">Upstash Inc.</td>
                <td className="p-3">
                  Rate limiting (processes IP-based identifiers)
                </td>
                <td className="p-3">USA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Resend:</strong> Resend operates
          as a sub-processor of Supabase for email delivery. Email addresses and
          transactional email content (such as verification codes) transit
          through Resend&apos;s infrastructure.
        </p>
      </section>

      {/* Section 6 */}
      <section id="data-transfers" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          6. International Data Transfers
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Your personal data may be transferred to and processed in countries
          outside Switzerland, particularly the United States, where our service
          providers are located.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          For transfers outside Switzerland, we rely on one or more safeguards
          in accordance with nDSG Art. 16 and Art. 17, depending on the provider
          and transfer context:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">
              Adequacy decisions and recognized frameworks:
            </strong>{" "}
            where available and applicable under Swiss law.
          </li>
          <li>
            <strong className="text-foreground">
              Standard contractual safeguards:
            </strong>{" "}
            such as Standard Contractual Clauses (or equivalent clauses) where
            available.
          </li>
          <li>
            <strong className="text-foreground">Contract necessity:</strong>{" "}
            Certain transfers are necessary for the performance of a contract
            with you (for example authentication, service hosting, and package
            download delivery) in accordance with nDSG Art. 17(1)(b).
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          By using the Services, you acknowledge that your data may be
          transferred internationally as described above. You can obtain further
          information about the specific safeguards in place for each provider
          by contacting us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      {/* Section 7 */}
      <section id="retention" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">7. Data Retention</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We retain data only for as long as necessary to fulfill the purposes
          for which it was collected, to operate the Services, and to meet
          legal, tax, accounting, fraud-prevention, and security obligations:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Account data:</strong> Your
            account consists of your email address, an internal identifier
            (UUID), and passkey credentials. This data is retained while your
            account is active. After account deletion, core account records are
            deleted, except where retention is required for legal, security,
            abuse-prevention, or dispute purposes.
          </li>
          <li>
            <strong className="text-foreground">
              Product access/download data:
            </strong>{" "}
            Product/package request logs and associated security records may be
            retained where required by legal, security, abuse-prevention, and
            compliance obligations. Where possible, direct account linkage is
            removed or minimized after account deletion.
          </li>
          <li>
            <strong className="text-foreground">Consent audit records:</strong>{" "}
            Where a product flow requires explicit legal acceptance, we may
            record acceptance metadata (for example timestamp, technical request
            metadata, and legal version identifier). This evidence may be
            retained for contract and consent proof. After account deletion,
            direct user linkage may be removed where legally and operationally
            appropriate.
          </li>
          <li>
            <strong className="text-foreground">Communication records:</strong>{" "}
            Retained for as long as needed to process inquiries, resolve
            disputes, and comply with legal obligations.
          </li>
          <li>
            <strong className="text-foreground">Technical logs:</strong>{" "}
            Retained for a limited period for security, fraud-prevention,
            service reliability, and incident response (target retention up to 6
            months / 183 days under current operational policy, unless a longer
            period is required for a specific incident, dispute, or legal hold).
          </li>
          <li>
            <strong className="text-foreground">
              Contract/accounting evidence:
            </strong>{" "}
            Certain non-content records required for legal, tax, accounting, or
            contractual proof obligations may be retained for longer periods
            where required by Swiss law (for example, up to 10 years).
          </li>
          <li>
            <strong className="text-foreground">Rate limiting data:</strong>{" "}
            IP-based identifiers used for rate limiting are stored in Redis
            (Upstash). Standard rate-limit windows are short-lived (typically 1
            to 5 minutes depending on the endpoint); some anti-abuse lockout
            counters and lockout state can be retained longer (up to 24 hours)
            for account security.
          </li>
          <li>
            <strong className="text-foreground">Access history data:</strong>{" "}
            Retained only where generated and as necessary for service
            operations, security, abuse prevention, and any legally required
            period thereafter.
          </li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="your-rights" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">8. Your Rights</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Under the nDSG and other applicable Swiss law, you have the following
          rights regarding your personal data:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">
              Right of Access (Art. 25 nDSG):
            </strong>{" "}
            You have the right to request a copy of the personal data we hold
            about you.
          </li>
          <li>
            <strong className="text-foreground">
              Right to Rectification (Art. 32(1) nDSG and Art. 6(5) nDSG):
            </strong>{" "}
            You have the right to request correction of inaccurate or incomplete
            data.
          </li>
          <li>
            <strong className="text-foreground">Right to Erasure:</strong> You
            have the right to request deletion of your personal data, subject to
            legal retention requirements.
          </li>
          <li>
            <strong className="text-foreground">
              Right to Data Portability (Art. 28 nDSG):
            </strong>{" "}
            You have the right to receive your data in a structured, commonly
            used format.
          </li>
          <li>
            <strong className="text-foreground">
              Right to Object (Art. 30(2)(b) nDSG):
            </strong>{" "}
            You have the right to object to the disclosure of your data to third
            parties in certain circumstances.
          </li>
          <li>
            <strong className="text-foreground">
              Right to Withdraw Consent:
            </strong>{" "}
            Where processing is based on consent, you may withdraw it at any
            time without affecting prior processing.
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Self-Service Account Deletion:
          </strong>{" "}
          You can request deletion of your account directly from your account
          settings at{" "}
          <a
            href={`${urls.store}/account`}
            className="hover:text-foreground underline transition-colors"
          >
            helvety.com/store/account
          </a>
          . Upon confirmation, the deletion request is processed immediately and
          account-linked data is removed across Helvety services without undue
          delay, including authentication credentials, task data, contact data,
          and note data. Full propagation across dependent systems may still
          require technical processing time. Depending on system architecture
          and legal obligations, some records may be deleted, de-identified, or
          retained in restricted form for compliance, fraud-prevention, dispute
          handling, or security purposes. This action is intended to be
          permanent and may not be reversible. We recommend exporting your data
          before proceeding.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Self-Service Data Export:</strong>{" "}
          You can export your personal data from your account settings. The
          export includes your profile information in JSON format. For Helvety
          Tasks, Helvety Contacts, and Helvety Notes (end-to-end encrypted
          data), you can initiate an export from within the app while
          authenticated with your passkey; the data is decrypted client-side and
          exported locally. Server-side exports of encrypted data are available
          only in encrypted form.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          To exercise any of these rights, you may also contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject line &quot;Data Export Request,&quot; &quot;Account
          Deletion Request,&quot; or a description of the right you wish to
          exercise. We will verify your identity and respond within the
          timeframe required by applicable law, and in many cases within 30
          days, subject to legal and operational constraints.
        </p>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            Right to Lodge a Complaint:
          </strong>{" "}
          If you believe your data protection rights have been violated, you
          have the right to lodge a complaint with the Swiss supervisory
          authority (Art. 19 nDSG): Eidgenössischer Datenschutz- und
          Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern,
          Switzerland,{" "}
          <a
            href="https://www.edoeb.admin.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline transition-colors"
          >
            https://www.edoeb.admin.ch
          </a>
          .
        </p>
      </section>

      {/* Section 9 */}
      <section id="cookies" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">9. Cookies and Tracking</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We use essential cookies and similar storage technologies that are
          necessary for operation and security of the Services. Depending on the
          service, we may also use privacy-focused telemetry tools for product
          analytics and performance monitoring. Examples include:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Authentication cookies:</strong>{" "}
            To keep you logged in during your session.
          </li>
          <li>
            <strong className="text-foreground">Security cookies:</strong> To
            protect against security threats.
          </li>
          <li>
            <strong className="text-foreground">Preference cookies:</strong> To
            remember your settings (e.g., theme preference).
          </li>
        </ul>
        <div className="legal-table-wrap mb-4 overflow-x-auto">
          <table className="border-border w-full border text-sm">
            <thead>
              <tr className="bg-card">
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Cookie / Storage
                </th>
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Purpose
                </th>
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Domain
                </th>
                <th className="border-border text-foreground border-b p-3 text-left font-medium">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr>
                <td className="border-border border-b p-3">
                  Supabase auth session
                </td>
                <td className="border-border border-b p-3">
                  Authentication session (httpOnly)
                </td>
                <td className="border-border border-b p-3">.helvety.com</td>
                <td className="border-border border-b p-3">
                  Session (short-lived tokens with automatic refresh and
                  expiration controls)
                </td>
              </tr>
              <tr>
                <td className="border-border border-b p-3">csrf_token</td>
                <td className="border-border border-b p-3">
                  CSRF protection (httpOnly)
                </td>
                <td className="border-border border-b p-3">.helvety.com</td>
                <td className="border-border border-b p-3">24 hours</td>
              </tr>
              <tr>
                <td className="border-border border-b p-3">
                  webauthn_challenge
                </td>
                <td className="border-border border-b p-3">
                  Passkey authentication challenge (httpOnly)
                </td>
                <td className="border-border border-b p-3">
                  helvety.com (path: /)
                </td>
                <td className="border-border border-b p-3">3 minutes</td>
              </tr>
              <tr>
                <td className="p-3">Theme preference (localStorage)</td>
                <td className="p-3">Remember dark/light mode setting</td>
                <td className="p-3">helvety.com</td>
                <td className="p-3">Persistent</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          We use Vercel Analytics, a privacy-focused analytics service, to
          understand how our Services are used. Vercel Analytics collects:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Page view counts and navigation patterns</li>
          <li>Referrer URLs (how you arrived at our site)</li>
          <li>Browser and device type</li>
          <li>Country-level geographic location</li>
          <li>
            Performance metrics (via Vercel Speed Insights on helvety.com)
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Based on our current implementation and vendor documentation, Vercel
          Analytics is designed to operate without advertising trackers and
          without cross-site profiling by us. Analytics data is typically
          aggregated and pseudonymized/anonymized by provider tooling. You can
          learn more at{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline transition-colors"
          >
            Vercel&apos;s Analytics Privacy Policy
          </a>
          .
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          We use Vercel Analytics across Helvety apps and Vercel Speed Insights
          on helvety.com. We do not intentionally operate advertising trackers
          or cross-site profiling technologies.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Essential cookies do not require consent under Swiss law as they are
          necessary for the Services to function. You can configure your browser
          to reject cookies, but this may affect your ability to use certain
          features.
        </p>

        <h3 className="mb-3 text-lg font-medium">9.1 Do Not Track (DNT)</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          &quot;Do Not Track&quot; (DNT) is a browser setting that requests
          websites not to track the user. We do not currently respond to DNT
          signals in a standardized manner, as there is no industry-wide
          standard for DNT. Our current analytics configuration is described
          above in this Section 9.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          9.2 Automated Decision-Making
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We use automated security controls (for example, fraud detection, spam
          filtering, rate-limiting, and temporary lockouts) to protect accounts
          and services. These controls may temporarily restrict access where
          abuse patterns are detected. We do not use automated profiling for
          advertising or automated decisions that produce legal effects beyond
          security/access protection. If this changes in the future, we will
          update this policy and, where required, provide notice and an
          opportunity to object.
        </p>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Note:</strong> We may use
          automated anti-abuse and security tooling (for example rate-limiting
          and anomaly detection) to protect the Services.
        </p>
      </section>

      {/* Section 10 */}
      <section id="security" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">10. Security Measures</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We implement appropriate technical and organizational measures to
          protect your personal data against unauthorized access, alteration,
          disclosure, or destruction:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Encryption of data in transit (TLS/HTTPS)</li>
          <li>Encryption of data at rest</li>
          <li>
            Client-side end-to-end encryption using passkey-derived keys (for
            applicable services)
          </li>
          <li>
            Zero-knowledge-oriented architecture in which encryption keys are
            derived client-side and are designed not to be persisted on our
            servers
          </li>
          <li>Secure authentication mechanisms</li>
          <li>Access controls and authentication for administrative access</li>
          <li>
            Rate limiting to protect against brute force attacks on
            authentication endpoints
          </li>
          <li>
            CSRF (Cross-Site Request Forgery) protection using secure token
            validation
          </li>
          <li>
            Short-lived session tokens with automatic refresh and expiry
            controls
          </li>
          <li>Security event logging for audit trails and incident response</li>
          <li>Periodic internal security reviews</li>
          <li>Secure hosting infrastructure</li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          While we strive to protect your personal data, no method of
          transmission over the internet or electronic storage is 100% secure.
          We cannot guarantee absolute security.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          10.1 Data Breach Notification
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          In the event of a personal data breach that is likely to result in a
          risk to your rights and freedoms, we will:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Notify the Swiss FDPIC (Eidgenössischer Datenschutz- und
            Öffentlichkeitsbeauftragter) as soon as possible after becoming
            aware of the breach, as required by Article 24 nDSG
          </li>
          <li>
            Notify affected individuals without undue delay if the breach is
            likely to result in a high risk to their rights and freedoms
          </li>
          <li>
            Document the breach, including its effects and the remedial actions
            taken
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Our breach notification will include, where possible: a description of
          the nature of the breach, the likely consequences, the measures taken
          to address the breach, and contact information for further inquiries.
        </p>

        <h3 className="mb-3 text-lg font-medium">10.2 End-to-End Encryption</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety Tasks, Helvety Contacts, and Helvety Notes implement
          end-to-end encryption to protect your content. Other Helvety services
          (helvety.com, Helvety Auth, Helvety PDF, Helvety Store) do not use
          end-to-end encryption. For Helvety Tasks, Helvety Contacts, and
          Helvety Notes:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Encryption keys are derived from your passkey using the WebAuthn PRF
            (Pseudo-Random Function) extension
          </li>
          <li>
            Encryption and decryption operations are designed to occur locally
            in your browser
          </li>
          <li>
            We store non-secret PRF metadata (including salt and key-check
            values) that allows your device to re-derive and validate the same
            key
          </li>
          <li>
            Our architecture is designed so that we are generally unable to
            decrypt your content during normal operation because encryption keys
            are derived client-side and are not intentionally stored on our
            servers
          </li>
          <li>
            Your passkey (stored on your device) is required to access encrypted
            content
          </li>
          <li>
            Additional Authenticated Data (AAD) binds each ciphertext to a
            specific record, preventing encrypted data from being moved or
            replayed in a different context
          </li>
          <li>
            Record identifiers for encrypted data are generated on your device,
            not by our servers
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Helvety Tasks encrypted fields:
          </strong>{" "}
          titles, descriptions, and start/end dates.{" "}
          <strong className="text-foreground">
            Non-encrypted structural metadata:
          </strong>{" "}
          record identifiers, timestamps, priority levels, display preferences
          (sort orders), and entity relationships (e.g., stage and label
          references).
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Helvety Contacts encrypted fields:
          </strong>{" "}
          first and last names, description, email, phone, birthday, and notes.{" "}
          <strong className="text-foreground">
            Non-encrypted structural metadata:
          </strong>{" "}
          record identifiers, timestamps, display preferences (sort orders), and
          immutable built-in taxonomy references (category IDs).
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Helvety Notes encrypted fields:
          </strong>{" "}
          title and description.{" "}
          <strong className="text-foreground">
            Non-encrypted structural metadata:
          </strong>{" "}
          record identifiers, timestamps, display preferences (sort order), and
          relationship metadata used for cross-app linking.
        </p>
        <p className="text-muted-foreground text-sm">
          This approach is designed to help protect your encrypted content in
          the event of a data breach on our servers. Browser requirements for
          end-to-end encryption can change over time; refer to the current
          product documentation for supported platforms.
        </p>
      </section>

      {/* Section 11 */}
      <section id="children" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          11. Children&apos;s Privacy
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services are not intended for individuals under 18 years of age.
          We do not knowingly collect personal data from children under 18.
        </p>
        <p className="text-muted-foreground text-sm">
          If you are a parent or guardian and believe your child has provided us
          with personal data, please contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          . If we become aware that we have collected personal data from a child
          under 18, we will take steps to delete such information promptly.
        </p>
      </section>

      {/* Section 12 */}
      <section id="changes" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          12. Changes to This Policy
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or applicable laws. When we make material changes, we
          will update the &quot;Last reviewed&quot; date and, where required by
          law or reasonably practicable, provide notice:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Update the &quot;Last reviewed&quot; date at the top of this page
          </li>
          <li>
            Via email (for account holders) and/or through a notice on the
            Services
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          We encourage you to review this Privacy Policy periodically. Your
          continued use of the Services after changes are posted constitutes
          your acceptance of the revised policy.
        </p>
      </section>

      {/* Section 13 */}
      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">13. Contact Information</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          For any questions about this Privacy Policy or our data practices, or
          to exercise your data protection rights, please contact us:
        </p>
        <address className="text-muted-foreground text-sm not-italic">
          <strong className="text-foreground">Helvety by Rubin</strong>
          <br />
          Holeestrasse 116
          <br />
          4054 Basel
          <br />
          Switzerland
          <br />
          <br />
          Email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-foreground underline transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <br />
          Phone:{" "}
          <a
            href="tel:+41798700208"
            className="hover:text-foreground underline transition-colors"
          >
            +41 79 870 02 08
          </a>
        </address>
      </section>

      {/* Final Notice */}
      <LegalFooterNote>
        <p className="text-muted-foreground text-center text-xs">
          By using Helvety services, you acknowledge that this Privacy Policy
          applies to your use of the services.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
