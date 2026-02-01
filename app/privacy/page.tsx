import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Helvety",
  description: "Privacy Policy for Helvety - How we handle your data",
};

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
              Last updated: February 1, 2026
            </p>
          </header>

          {/* Introduction */}
          <p className="text-muted-foreground text-sm">
            Helvety by Rubin (&quot;we,&quot; &quot;us,&quot; or &quot;the
            Company&quot;) respects your privacy and is committed to protecting
            your personal data. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use Helvety
            services (&quot;the Services&quot;). This policy complies with the
            Swiss Federal Act on Data Protection (DSG/nDSG), the EU General Data
            Protection Regulation (GDPR), and other applicable data protection
            laws.
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
                  href="#california"
                  className="hover:text-foreground transition-colors"
                >
                  California Privacy Rights
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
              When you create an account, we use passkey authentication
              (biometrics via your device). We do not collect email addresses,
              names, or other personal information during account registration.
              We store only:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                A unique internal identifier (UUID) generated automatically
              </li>
              <li>
                Passkey credentials (public key and metadata for authentication)
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              This privacy-focused approach means you can create and use a
              Helvety account without providing any personal information.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              2.2 Order and Transaction Data
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              When you make a purchase, we collect:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>Purchase history and order details</li>
              <li>Shipping address (for physical products)</li>
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
              In accordance with GDPR Article 13(2)(e), we inform you about
              whether providing personal data is a statutory or contractual
              requirement:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Account Creation:</strong>{" "}
                Creating an account requires only passkey authentication using
                your device&apos;s biometrics (Face ID, fingerprint, or PIN). No
                personal data such as email or name is required. A unique
                identifier is generated automatically.
              </li>
              <li>
                <strong className="text-foreground">Purchases:</strong>{" "}
                When you make a purchase, payment and billing information
                (including email, name, and address) is collected directly by
                our payment processor, Stripe. This information is required to
                process your order and is subject to Stripe&apos;s privacy
                policy. Helvety does not collect or store this information
                directly.
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
          </section>

          {/* Section 3 */}
          <section id="legal-basis">
            <h2 className="mb-4 text-xl font-semibold">
              3. Legal Basis for Processing
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We process your personal data based on the following legal grounds
              (as required by GDPR and Swiss DSG):
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Contract Performance (Art. 6(1)(b) GDPR):
                </strong>{" "}
                Processing necessary to fulfill our contractual obligations to
                you, including processing orders, managing subscriptions, and
                providing the Services.
              </li>
              <li>
                <strong className="text-foreground">
                  Legal Obligations (Art. 6(1)(c) GDPR):
                </strong>{" "}
                Processing required to comply with applicable laws, such as tax
                and accounting requirements.
              </li>
              <li>
                <strong className="text-foreground">
                  Legitimate Interests (Art. 6(1)(f) GDPR):
                </strong>{" "}
                Processing for our legitimate business interests, such as fraud
                prevention, security, and improving our Services, where such
                interests are not overridden by your rights.
              </li>
              <li>
                <strong className="text-foreground">
                  Consent (Art. 6(1)(a) GDPR):
                </strong>{" "}
                Where you have given explicit consent, such as for marketing
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
                      Website hosting and delivery
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
                    <td className="p-3">Resend Inc.</td>
                    <td className="p-3">Transactional email delivery</td>
                    <td className="p-3">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">
              All service providers are contractually obligated to protect your
              data and process it only according to our instructions. Where
              applicable, we have entered into Data Processing Agreements (DPAs)
              with these providers.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Stripe:</strong> As a PCI DSS
              Level 1 certified payment processor, Stripe handles all payment
              card information. We do not have access to or store your complete
              card details.
            </p>
          </section>

          {/* Section 6 */}
          <section id="data-transfers">
            <h2 className="mb-4 text-xl font-semibold">
              6. International Data Transfers
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Your personal data may be transferred to and processed in
              countries outside Switzerland and the European Economic Area
              (EEA), particularly the United States, where our service providers
              are located.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              For transfers to the USA, we rely on the following safeguards to
              ensure adequate protection of your data:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  EU-US Data Privacy Framework:
                </strong>{" "}
                Where applicable, our US-based providers are certified under the
                EU-US Data Privacy Framework.
              </li>
              <li>
                <strong className="text-foreground">
                  Standard Contractual Clauses (SCCs):
                </strong>{" "}
                We use EU Commission-approved Standard Contractual Clauses for
                data transfers where required.
              </li>
              <li>
                <strong className="text-foreground">
                  Swiss-US Safeguards:
                </strong>{" "}
                We implement appropriate safeguards recognized under Swiss data
                protection law.
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              By using the Services, you acknowledge that your data may be
              transferred internationally as described above.
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
                <strong className="text-foreground">Account data:</strong>{" "}
                Your account consists of an internal identifier (UUID) and
                passkey credentials only—no email or personal information is
                stored. This data is retained while your account is active and
                for up to 2 years after account deletion for legal compliance.
              </li>
              <li>
                <strong className="text-foreground">Transaction data:</strong>{" "}
                Subscription and purchase records (linked to your account ID and
                Stripe customer ID) are retained for 10 years as required by
                Swiss accounting and tax laws (Art. 958f Swiss Code of
                Obligations). Note that your email and billing details are
                stored by Stripe, not by Helvety.
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
                tax and accounting compliance. Subscription history (plan
                changes, upgrades, downgrades, cancellations) is retained as
                part of transaction records.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="your-rights">
            <h2 className="mb-4 text-xl font-semibold">8. Your Rights</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Under the GDPR, Swiss DSG, and other applicable laws, you have the
              following rights regarding your personal data:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  Right of Access (Art. 15 GDPR / Art. 25 DSG):
                </strong>{" "}
                You have the right to request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Rectification (Art. 16 GDPR / Art. 32 DSG):
                </strong>{" "}
                You have the right to request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Erasure (Art. 17 GDPR):
                </strong>{" "}
                You have the right to request deletion of your personal data,
                subject to legal retention requirements.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Restrict Processing (Art. 18 GDPR):
                </strong>{" "}
                You have the right to request limitation of processing in
                certain circumstances.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Data Portability (Art. 20 GDPR / Art. 28 DSG):
                </strong>{" "}
                You have the right to receive your data in a structured,
                commonly used format.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Object (Art. 21 GDPR / Art. 32 DSG):
                </strong>{" "}
                You have the right to object to processing based on legitimate
                interests.
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
              </a>
              . We will respond to your request within 30 days.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">
                Right to Lodge a Complaint:
              </strong>{" "}
              If you believe your data protection rights have been violated, you
              have the right to lodge a complaint with a supervisory authority.
              In Switzerland, this is the Federal Data Protection and
              Information Commissioner (FDPIC). In the EU, you may contact the
              data protection authority in your country of residence.
            </p>
          </section>

          {/* Section 9 - California Privacy Rights */}
          <section id="california">
            <h2 className="mb-4 text-xl font-semibold">
              9. California Privacy Rights (CCPA/CPRA)
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              If you are a California resident, you have additional rights under
              the California Consumer Privacy Act (CCPA) as amended by the
              California Privacy Rights Act (CPRA):
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Right to Know:</strong> You
                have the right to request information about the categories and
                specific pieces of personal information we have collected about
                you, the sources of that information, our purposes for
                collecting it, and the categories of third parties with whom we
                share it.
              </li>
              <li>
                <strong className="text-foreground">Right to Delete:</strong>{" "}
                You have the right to request that we delete the personal
                information we have collected from you, subject to certain
                exceptions.
              </li>
              <li>
                <strong className="text-foreground">Right to Correct:</strong>{" "}
                You have the right to request that we correct inaccurate
                personal information we maintain about you.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Opt-Out of Sale/Sharing:
                </strong>{" "}
                You have the right to opt-out of the &quot;sale&quot; or
                &quot;sharing&quot; of your personal information.{" "}
                <strong>
                  We do not sell or share your personal information
                </strong>{" "}
                as defined under CCPA/CPRA.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Limit Use of Sensitive Personal Information:
                </strong>{" "}
                You have the right to limit the use and disclosure of sensitive
                personal information.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to Non-Discrimination:
                </strong>{" "}
                You have the right not to receive discriminatory treatment for
                exercising your privacy rights.
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">
                How to Exercise Your Rights:
              </strong>{" "}
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:contact@helvety.com"
                className="hover:text-foreground underline transition-colors"
              >
                contact@helvety.com
              </a>
              . We will verify your identity before processing your request and
              respond within 45 days (or up to 90 days in certain circumstances,
              with notice).
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Authorized Agents:</strong>{" "}
              You may designate an authorized agent to make a request on your
              behalf. We may require proof of your authorization and
              verification of your identity.
            </p>
          </section>

          {/* Section 10 */}
          <section id="cookies">
            <h2 className="mb-4 text-xl font-semibold">
              10. Cookies and Tracking
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
              We use Vercel Analytics, a privacy-respecting analytics service
              provided by Vercel Inc., to understand how our Services are used.
              Vercel Analytics does not use cookies and does not track users
              across websites. It collects anonymized usage data to help us
              improve the Services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Essential cookies do not require consent under Swiss and EU law as
              they are necessary for the Services to function. You can configure
              your browser to reject cookies, but this may affect your ability
              to use certain features.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              10.1 Do Not Track (DNT)
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              &quot;Do Not Track&quot; (DNT) is a browser setting that requests
              websites not to track the user. We do not currently respond to DNT
              signals in a standardized manner, as there is no industry-wide
              standard for DNT. However, because we do not engage in cross-site
              tracking or sell your personal information, the practical effect
              is the same regardless of your DNT setting.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              10.2 Automated Decision-Making
            </h3>
            <p className="text-muted-foreground text-sm">
              We do not use automated decision-making processes, including
              profiling, that produce legal effects concerning you or similarly
              significantly affect you, as described in Article 22 GDPR. While
              we may use automated tools for fraud detection, spam filtering, or
              service optimization, these processes do not result in decisions
              that have legal or similarly significant effects on individuals.
              If this changes in the future, we will update this policy and,
              where required, provide you with notice and an opportunity to
              object.
            </p>
          </section>

          {/* Section 11 */}
          <section id="security">
            <h2 className="mb-4 text-xl font-semibold">
              11. Security Measures
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, disclosure, or destruction:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>Encryption of data in transit (TLS/HTTPS)</li>
              <li>Encryption of data at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>
                Access controls and authentication for administrative access
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
              11.1 Data Breach Notification
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              In the event of a personal data breach that is likely to result in
              a risk to your rights and freedoms, we will:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Notify the relevant supervisory authority (Swiss FDPIC and/or
                applicable EU data protection authorities) within 72 hours of
                becoming aware of the breach, as required by Article 33 GDPR and
                Swiss DSG
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
            <p className="text-muted-foreground text-sm">
              Our breach notification will include, where possible: a
              description of the nature of the breach, the likely consequences,
              the measures taken to address the breach, and contact information
              for further inquiries.
            </p>
          </section>

          {/* Section 12 */}
          <section id="children">
            <h2 className="mb-4 text-xl font-semibold">
              12. Children&apos;s Privacy
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

          {/* Section 13 */}
          <section id="changes">
            <h2 className="mb-4 text-xl font-semibold">
              13. Changes to This Policy
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

          {/* Section 14 */}
          <section id="contact">
            <h2 className="mb-4 text-xl font-semibold">
              14. Contact Information
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
