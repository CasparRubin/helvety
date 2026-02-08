import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Helvety",
  description: "Privacy Policy for Helvety - How we handle your data",
};

/** Privacy Policy page for Helvety */
export default function PrivacyPage() {
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
            <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: February 8, 2026
            </p>
          </header>

          {/* Introduction */}
          <p className="text-muted-foreground text-sm">
            Helvety by Rubin (&quot;we,&quot; &quot;us,&quot; or &quot;the
            Company&quot;) respects your privacy and is committed to protecting
            your personal data. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use Helvety
            services (&quot;the Services&quot;). This policy complies with the
            Swiss Federal Act on Data Protection (nDSG) and other applicable
            data protection laws.
          </p>
          <p className="text-muted-foreground text-sm">
            Our services are intended exclusively for customers located in
            Switzerland. We do not offer services to individuals located in the
            European Union (EU) or European Economic Area (EEA). This Privacy
            Policy is governed exclusively by the Swiss Federal Act on Data
            Protection (nDSG); the EU General Data Protection Regulation (GDPR)
            does not apply.
          </p>

          {/* Table of Contents */}
          <nav className="bg-card border-border border p-6">
            <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
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
          </nav>

          {/* Section 1 */}
          <section id="controller">
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
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
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
              For any privacy-related inquiries or to exercise your data
              protection rights, please contact us at the above address.
            </p>
          </section>

          {/* Section 2 */}
          <section id="data-collected">
            <h2 className="mb-4 text-xl font-semibold">2. Data We Collect</h2>

            <h3 className="mb-3 text-lg font-medium">
              2.1 Account Information
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              When you create an account, we collect your email address for
              authentication purposes. We use a secure authentication process:
              new users (and existing users without a passkey) receive a
              verification code by email, then passkey setup or verification;
              existing users with a passkey sign in directly with their passkey
              (biometrics via your device). We store:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Your email address (used for authentication and account
                recovery)
              </li>
              <li>
                A unique internal identifier (UUID) generated automatically
              </li>
              <li>
                Passkey credentials (public key and metadata for authentication)
              </li>
              <li>
                Encryption passkey parameters (PRF salt values for deriving
                encryption keys, for Helvety Tasks which uses end-to-end
                encryption)
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              Your email address is used solely for authentication (verification
              codes for new users, passkey for returning users) and important
              account notifications. We do not share your email with third
              parties for marketing purposes.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              2.2 Order and Transaction Data
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              When you make a purchase, we collect:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>Purchase history and order details</li>
              <li>
                Shipping address (if and when physical products are offered)
              </li>
              <li>
                Billing information (processed by Stripe; we do not store
                complete payment card details)
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
              <li>Pages visited and features used</li>
              <li>Date and time of access</li>
              <li>Referring website</li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">2.4 Communication Data</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              If you contact us, we collect the information you provide in your
              communication, including your email address and message content.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              2.5 License Validation Data
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              For enterprise products (such as SharePoint extensions), our
              software may validate licenses by sending your organization&apos;s
              tenant identifier (e.g., &quot;contoso&quot; from
              contoso.sharepoint.com) to our servers at store.helvety.com. This
              data:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Does not include personal data, only your organization&apos;s
                tenant identifier
              </li>
              <li>Is used solely to verify your subscription status</li>
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
              We inform you about whether providing personal data is a statutory
              or contractual requirement:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Account Creation:</strong>{" "}
                Creating an account requires your email address (for
                verification codes when signing up or recovering access) and
                passkey setup using your device&apos;s biometrics (Face ID,
                fingerprint, or PIN). Your email is necessary for account
                verification and recovery. A unique identifier is generated
                automatically.
              </li>
              <li>
                <strong className="text-foreground">Purchases:</strong> When you
                make a purchase, payment and billing information (including
                email, name, and address) is collected directly by our payment
                processor, Stripe. This information is required to process your
                order and is subject to Stripe&apos;s privacy policy. Helvety
                does not collect or store this information directly.
              </li>
              <li>
                <strong className="text-foreground">License Validation:</strong>{" "}
                For enterprise products, sending your organization&apos;s tenant
                identifier is necessary for license validation. Without this,
                the software cannot verify your subscription status.
              </li>
              <li>
                <strong className="text-foreground">Communication:</strong>{" "}
                Providing contact information when you reach out to us is
                voluntary but necessary if you wish to receive a response.
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">2.7 Encryption Data</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Helvety Tasks uses end-to-end encryption to protect your data. For
              this service, we store:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                PRF parameters (Pseudo-Random Function extension data) used to
                derive encryption keys from your passkey
              </li>
              <li>Encrypted data fields (where applicable)</li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Important:</strong> Encryption
              keys are derived client-side in your browser using the WebAuthn
              PRF extension. We never have access to your actual encryption
              keys. This zero-knowledge architecture means that even if our
              servers were compromised, your encrypted data would remain
              protected.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Browser Requirements:</strong>{" "}
              End-to-end encryption requires a modern browser with WebAuthn PRF
              support (Chrome 128+, Edge 128+, Safari 18+, Firefox 139+ desktop
              only). Firefox for Android does not support the PRF extension.
            </p>
          </section>

          {/* Section 3 */}
          <section id="legal-basis">
            <h2 className="mb-4 text-xl font-semibold">
              3. Legal Basis for Processing
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We process your personal data in accordance with the principles
              set out in Art. 6 nDSG: lawfulness, proportionality, purpose
              limitation, transparency, accuracy, and data security. Our
              processing is based on the following grounds:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Contract performance:
                </strong>{" "}
                Processing necessary to fulfill our contractual obligations to
                you, including processing orders, managing subscriptions, and
                providing the Services.
              </li>
              <li>
                <strong className="text-foreground">Legal obligations:</strong>{" "}
                Processing required to comply with applicable Swiss law, such as
                tax and accounting requirements (e.g., Art. 958f Swiss Code of
                Obligations).
              </li>
              <li>
                <strong className="text-foreground">
                  Legitimate interests:
                </strong>{" "}
                Processing for our legitimate business interests, such as fraud
                prevention, security, and improving our Services, where such
                interests are not overridden by your rights.
              </li>
              <li>
                <strong className="text-foreground">Consent:</strong> Where you
                have given explicit consent, such as for marketing
                communications. You may withdraw consent at any time.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="how-we-use">
            <h2 className="mb-4 text-xl font-semibold">
              4. How We Use Your Data
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We use your personal data for the following purposes:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>To create and manage your account</li>
              <li>To process and fulfill your orders</li>
              <li>To manage subscriptions and billing</li>
              <li>
                To send transactional emails (order confirmations, receipts,
                etc.)
              </li>
              <li>To provide customer support</li>
              <li>To detect and prevent fraud and security incidents</li>
              <li>To comply with legal obligations</li>
              <li>To improve and optimize the Services</li>
              <li>To enforce our Terms of Service</li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">
              4.1 Marketing Communications
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We will only send you marketing communications (such as
              newsletters, promotional offers, or product announcements) if you
              have given us your explicit consent to do so.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Opt-Out:</strong> You can
              withdraw your consent and unsubscribe from marketing
              communications at any time by:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Clicking the &quot;unsubscribe&quot; link at the bottom of any
                marketing email
              </li>
              <li>
                Updating your communication preferences in your account settings
              </li>
              <li>Contacting us at contact@helvety.com</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Please note that even if you opt out of marketing communications,
              we may still send you transactional or service-related
              communications (such as order confirmations, account
              notifications, or important service updates) as necessary to
              provide the Services.
            </p>
          </section>

          {/* Section 5 */}
          <section id="third-parties">
            <h2 className="mb-4 text-xl font-semibold">
              5. Third-Party Service Providers
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We share your personal data with the following third-party service
              providers who process data on our behalf:
            </p>

            <div className="mb-4 overflow-x-auto">
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
                    <td className="border-border border-b p-3">
                      Supabase Inc.
                    </td>
                    <td className="border-border border-b p-3">
                      Database and authentication
                    </td>
                    <td className="border-border border-b p-3">USA</td>
                  </tr>
                  <tr>
                    <td className="border-border border-b p-3">Stripe Inc.</td>
                    <td className="border-border border-b p-3">
                      Payment processing
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
                    <td className="p-3">Rate limiting</td>
                    <td className="p-3">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">
              All service providers are contractually obligated to protect your
              data and process it only according to our instructions. We have
              entered into Data Processing Agreements with these providers in
              accordance with nDSG Art. 9. We maintain a record of processing
              activities (Verzeichnis der Bearbeitungst&auml;tigkeiten) as
              required by Art. 12 nDSG.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Stripe:</strong> As a PCI DSS
              Level 1 certified payment processor, Stripe handles all payment
              card information. We do not have access to or store your complete
              card details. Stripe may perform automated fraud analysis on
              payment data as part of its processing services; for details, see{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline transition-colors"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Resend:</strong> Resend
              operates as a sub-processor of Supabase for email delivery. Email
              addresses and transactional email content (such as verification
              codes) transit through Resend&apos;s infrastructure.
            </p>
          </section>

          {/* Section 6 */}
          <section id="data-transfers">
            <h2 className="mb-4 text-xl font-semibold">
              6. International Data Transfers
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Your personal data may be transferred to and processed in
              countries outside Switzerland, particularly the United States,
              where our service providers are located.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              For transfers to the USA, we ensure adequate protection in
              accordance with nDSG Art. 16 and Art. 17:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Swiss-US Data Privacy Framework:
                </strong>{" "}
                The Swiss Federal Data Protection and Information Commissioner
                (FDPIC) has recognized the Swiss-US Data Privacy Framework
                (effective September 15, 2024) as providing adequate protection
                for data transfers to certified US organizations. Where
                applicable, our US-based providers are certified under the
                Swiss-US Data Privacy Framework.
              </li>
              <li>
                <strong className="text-foreground">
                  Additional safeguards:
                </strong>{" "}
                Where appropriate, we use contractual safeguards (such as
                standard contractual clauses) to ensure an adequate level of
                protection for your data.
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              By using the Services, you acknowledge that your data may be
              transferred internationally as described above. You can obtain
              further information about the safeguards in place by contacting us
              at{" "}
              <a
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
              </a>
              .
            </p>
          </section>

          {/* Section 7 */}
          <section id="retention">
            <h2 className="mb-4 text-xl font-semibold">7. Data Retention</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We retain data only for as long as necessary to fulfill the
              purposes for which it was collected:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Account data:</strong> Your
                account consists of your email address, an internal identifier
                (UUID), and passkey credentials. This data is retained while
                your account is active and for up to 2 years after account
                deletion for legal compliance.
              </li>
              <li>
                <strong className="text-foreground">Transaction data:</strong>{" "}
                Subscription and purchase records (linked to your account ID and
                Stripe customer ID) are retained for 10 years as required by
                Art. 958f Swiss Code of Obligations (accounting and tax
                retention). Note that your email and billing details are stored
                by Stripe, not by Helvety.
              </li>
              <li>
                <strong className="text-foreground">
                  Communication records:
                </strong>{" "}
                Retained for up to 3 years after last contact.
              </li>
              <li>
                <strong className="text-foreground">Technical logs:</strong>{" "}
                Retained for up to 90 days for security purposes.
              </li>
              <li>
                <strong className="text-foreground">Subscription data:</strong>{" "}
                Retained for the duration of your subscription plus 10 years for
                tax and accounting compliance (Art. 958f Swiss Code of
                Obligations). Subscription history (plan changes, upgrades,
                downgrades, cancellations) is retained as part of transaction
                records.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="your-rights">
            <h2 className="mb-4 text-xl font-semibold">8. Your Rights</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Under the nDSG and other applicable Swiss law, you have the
              following rights regarding your personal data:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Right of Access (Art. 25 nDSG):
                </strong>{" "}
                You have the right to request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Rectification (Art. 32(1) nDSG and Art. 6(5) nDSG):
                </strong>{" "}
                You have the right to request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong className="text-foreground">Right to Erasure:</strong>{" "}
                You have the right to request deletion of your personal data,
                subject to legal retention requirements.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Data Portability (Art. 28 nDSG):
                </strong>{" "}
                You have the right to receive your data in a structured,
                commonly used format.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Object (Art. 30(2)(b) nDSG):
                </strong>{" "}
                You have the right to object to the disclosure of your data to
                third parties in certain circumstances.
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
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
              </a>{" "}
              with the subject line &quot;Data Export Request,&quot;
              &quot;Account Deletion Request,&quot; or a description of the
              right you wish to exercise. We will verify your identity and
              respond to your request within 30 days.
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
          <section id="cookies">
            <h2 className="mb-4 text-xl font-semibold">
              9. Cookies and Tracking
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We use only essential cookies that are strictly necessary for the
              operation of the Services. These include:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Authentication cookies:
                </strong>{" "}
                To keep you logged in during your session.
              </li>
              <li>
                <strong className="text-foreground">Security cookies:</strong>{" "}
                To protect against security threats.
              </li>
              <li>
                <strong className="text-foreground">Preference cookies:</strong>{" "}
                To remember your settings (e.g., theme preference).
              </li>
            </ul>
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
                Performance metrics (on helvety.com only via Vercel Speed
                Insights)
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              Vercel Analytics does not use cookies and does not track
              individual users across sessions. Data is aggregated and
              anonymized. You can learn more at{" "}
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
              We do not use any other analytics services, advertising trackers,
              or cross-site tracking technologies.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Essential cookies do not require consent under Swiss law as they
              are necessary for the Services to function. You can configure your
              browser to reject cookies, but this may affect your ability to use
              certain features.
            </p>

            <h3 className="mb-3 text-lg font-medium">9.1 Do Not Track (DNT)</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              &quot;Do Not Track&quot; (DNT) is a browser setting that requests
              websites not to track the user. We do not currently respond to DNT
              signals in a standardized manner, as there is no industry-wide
              standard for DNT. However, because we do not engage in cross-site
              tracking or sell your personal information, the practical effect
              is the same regardless of your DNT setting.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              9.2 Automated Decision-Making
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We do not use automated decision-making processes, including
              profiling, that produce legal effects concerning you or similarly
              significantly affect you. While we may use automated tools for
              fraud detection, spam filtering, or service optimization, these
              processes do not result in decisions that have legal or similarly
              significant effects on individuals. If this changes in the future,
              we will update this policy and, where required, provide you with
              notice and an opportunity to object.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Note:</strong> Our payment
              processor, Stripe, may perform automated fraud analysis on payment
              transactions as part of its processing services. Such analysis is
              conducted by Stripe as an independent controller and is subject to
              nDSG principles and{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline transition-colors"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          {/* Section 10 */}
          <section id="security">
            <h2 className="mb-4 text-xl font-semibold">
              10. Security Measures
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, disclosure, or destruction:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>Encryption of data in transit (TLS/HTTPS)</li>
              <li>Encryption of data at rest</li>
              <li>
                Client-side end-to-end encryption using passkey-derived keys
                (for applicable services)
              </li>
              <li>
                Zero-knowledge architecture where encryption keys are never
                transmitted to or stored on our servers
              </li>
              <li>Secure authentication mechanisms</li>
              <li>
                Access controls and authentication for administrative access
              </li>
              <li>
                Rate limiting to protect against brute force attacks on
                authentication endpoints
              </li>
              <li>
                CSRF (Cross-Site Request Forgery) protection using secure token
                validation
              </li>
              <li>Automatic session timeout after periods of inactivity</li>
              <li>
                Security event logging for audit trails and incident response
              </li>
              <li>Regular security assessments</li>
              <li>Secure hosting infrastructure</li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              While we strive to protect your personal data, no method of
              transmission over the internet or electronic storage is 100%
              secure. We cannot guarantee absolute security.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              10.1 Data Breach Notification
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              In the event of a personal data breach that is likely to result in
              a risk to your rights and freedoms, we will:
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
                Document the breach, including its effects and the remedial
                actions taken
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              Our breach notification will include, where possible: a
              description of the nature of the breach, the likely consequences,
              the measures taken to address the breach, and contact information
              for further inquiries.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              10.2 End-to-End Encryption
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Helvety Tasks implements end-to-end encryption to protect your
              task data. Other Helvety services (helvety.com, Helvety Auth,
              Helvety PDF, Helvety Store) do not use end-to-end encryption. For
              Helvety Tasks:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Encryption keys are derived from your passkey using the WebAuthn
                PRF (Pseudo-Random Function) extension
              </li>
              <li>
                All encryption and decryption operations occur locally in your
                browser
              </li>
              <li>
                We store only PRF parameters (salt values) that allow your
                device to re-derive the same key
              </li>
              <li>
                We cannot decrypt your data as we never possess your encryption
                key
              </li>
              <li>
                Your passkey (stored on your device) is the only way to access
                encrypted data
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              This approach ensures that your encrypted data remains protected
              even in the event of a data breach on our servers. Browser
              requirements for end-to-end encryption: Chrome 128+, Edge 128+,
              Safari 18+, Firefox 139+ (desktop only).
            </p>
          </section>

          {/* Section 11 */}
          <section id="children">
            <h2 className="mb-4 text-xl font-semibold">
              11. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              The Services are not intended for individuals under 18 years of
              age. We do not knowingly collect personal data from children under
              18.
            </p>
            <p className="text-muted-foreground text-sm">
              If you are a parent or guardian and believe your child has
              provided us with personal data, please contact us at{" "}
              <a
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
              </a>
              . If we become aware that we have collected personal data from a
              child under 18, we will take steps to delete such information
              promptly.
            </p>
          </section>

          {/* Section 12 */}
          <section id="changes">
            <h2 className="mb-4 text-xl font-semibold">
              12. Changes to This Policy
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or applicable laws. When we make material
              changes, we will:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Update the &quot;Last updated&quot; date at the top of this page
              </li>
              <li>
                Notify you via email (if you have an account) or through a
                notice on the Services
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              We encourage you to review this Privacy Policy periodically. Your
              continued use of the Services after changes are posted constitutes
              your acceptance of the revised policy.
            </p>
          </section>

          {/* Section 13 */}
          <section id="contact">
            <h2 className="mb-4 text-xl font-semibold">
              13. Contact Information
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              For any questions about this Privacy Policy or our data practices,
              or to exercise your data protection rights, please contact us:
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
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
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
          <footer className="border-border border-t pt-8">
            <p className="text-muted-foreground text-center text-xs">
              By using Helvety services, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
