import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Helvety",
  description: "Terms of Service for Helvety - Software and Subscriptions",
};

/** Terms of Service page for Helvety */
export default function TermsPage() {
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
            <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">
              Last updated: February 8, 2026
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="bg-card border-border border p-6">
            <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>
                <a
                  href="#acceptance"
                  className="hover:text-foreground transition-colors"
                >
                  Acceptance of Terms
                </a>
              </li>
              <li>
                <a
                  href="#definitions"
                  className="hover:text-foreground transition-colors"
                >
                  Definitions
                </a>
              </li>
              <li>
                <a
                  href="#account"
                  className="hover:text-foreground transition-colors"
                >
                  Account Registration
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  className="hover:text-foreground transition-colors"
                >
                  Products and Services
                </a>
                <ul className="mt-1 ml-4 list-inside list-[circle] space-y-0.5">
                  <li>
                    <a
                      href="#software-saas-no-warranties"
                      className="hover:text-foreground transition-colors"
                    >
                      4.4 Software, Digital Products and SaaS – No Warranties
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  href="#free-services"
                  className="hover:text-foreground transition-colors"
                >
                  Free Services and Beta Features
                </a>
              </li>
              <li>
                <a
                  href="#acceptable-use"
                  className="hover:text-foreground transition-colors"
                >
                  Acceptable Use Policy
                </a>
              </li>
              <li>
                <a
                  href="#user-content"
                  className="hover:text-foreground transition-colors"
                >
                  User Content
                </a>
              </li>
              <li>
                <a
                  href="#ordering"
                  className="hover:text-foreground transition-colors"
                >
                  Online Ordering Process
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing and Payment
                </a>
              </li>
              <li>
                <a
                  href="#subscriptions"
                  className="hover:text-foreground transition-colors"
                >
                  Subscription Terms
                </a>
              </li>
              <li>
                <a
                  href="#refunds"
                  className="hover:text-foreground transition-colors"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="#ip"
                  className="hover:text-foreground transition-colors"
                >
                  Intellectual Property
                </a>
              </li>
              <li>
                <a
                  href="#liability"
                  className="hover:text-foreground transition-colors"
                >
                  Limitation of Liability
                </a>
              </li>
              <li>
                <a
                  href="#indemnification"
                  className="hover:text-foreground transition-colors"
                >
                  Indemnification
                </a>
              </li>
              <li>
                <a
                  href="#termination"
                  className="hover:text-foreground transition-colors"
                >
                  Termination
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
                  Changes to Terms
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
          <section id="acceptance">
            <h2 className="mb-4 text-xl font-semibold">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              By accessing or using any Helvety services, websites, or
              applications (&quot;the Services&quot;), operated by Helvety by
              Rubin (&quot;we,&quot; &quot;us,&quot; or &quot;the
              Company&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to all of these Terms,
              you must not access or use the Services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              The Services are offered exclusively to customers located in
              Switzerland. By accessing or using the Services, you confirm that
              you are located in Switzerland and are not a resident of the
              European Union (EU) or European Economic Area (EEA). We do not
              target or offer services to individuals outside Switzerland.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              These Terms constitute a legally binding agreement between you and
              Helvety by Rubin, a sole proprietorship (Einzelfirma) registered
              in Switzerland.
            </p>
            <p className="text-muted-foreground text-sm">
              Your continued use of the Services following the posting of any
              changes to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          {/* Section 2 */}
          <section id="definitions">
            <h2 className="mb-4 text-xl font-semibold">2. Definitions</h2>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                <strong className="text-foreground">
                  &quot;Services&quot;
                </strong>{" "}
                refers to all Helvety websites, applications, platforms, and
                related services.
              </li>
              <li>
                <strong className="text-foreground">
                  &quot;User,&quot; &quot;you,&quot; or &quot;your&quot;
                </strong>{" "}
                refers to any individual or entity accessing or using the
                Services.
              </li>
              <li>
                <strong className="text-foreground">
                  &quot;Digital Products&quot;
                </strong>{" "}
                refers to software, digital downloads, and other non-physical
                goods.
              </li>
              <li>
                <strong className="text-foreground">
                  &quot;SaaS Products&quot;
                </strong>{" "}
                refers to software-as-a-service subscriptions providing ongoing
                access to software.
              </li>
              <li>
                <strong className="text-foreground">
                  &quot;Physical Products&quot;
                </strong>{" "}
                refers to apparel and other tangible goods.
              </li>
              <li>
                <strong className="text-foreground">&quot;Content&quot;</strong>{" "}
                refers to all materials, including but not limited to software,
                text, images, and designs.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="account">
            <h2 className="mb-4 text-xl font-semibold">
              3. Account Registration
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              To access certain features of the Services, you must create an
              account. Account creation requires your email address and passkey
              setup. New users receive a verification code via email to verify
              their identity; existing users with a passkey sign in directly
              with their passkey. You then authenticate using your device&apos;s
              biometrics (Face ID, fingerprint, or PIN) to set up or use your
              passkey.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              By creating an account, you agree to:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>Provide a valid email address that you have access to.</li>
              <li>
                Maintain the security of your passkey and the device(s) on which
                it is stored.
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account.
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account.
              </li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Account Recovery:</strong> If
              you lose access to your passkey, you can request a new
              verification code sent to your registered email address to
              re-authenticate and set up a new passkey. We recommend keeping
              your passkey synced across your devices via iCloud Keychain,
              Google Password Manager, or similar services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Encryption Setup:</strong>{" "}
              Helvety Tasks uses end-to-end encryption to protect your task
              data. When using Helvety Tasks, you will be required to set up an
              encryption passkey after authentication. This uses the WebAuthn
              PRF (Pseudo-Random Function) extension to derive encryption keys
              on your device. The encryption keys are never transmitted to or
              stored on our servers. If you lose access to your encryption
              passkey, encrypted data may become permanently inaccessible. Other
              Helvety services (helvety.com, Helvety Auth, Helvety PDF, Helvety
              Store) do not use end-to-end encryption.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Age Requirement:</strong> You
              must be at least 18 years of age to create an account and use the
              Services. By creating an account, you represent and warrant that
              you are at least 18 years old.
            </p>
            <p className="text-muted-foreground text-sm">
              We reserve the right to suspend or terminate your account at our
              sole discretion, without prior notice, for conduct that we
              determine violates these Terms or is harmful to other users, us,
              or third parties, or for any other reason.
            </p>
          </section>

          {/* Section 4 */}
          <section id="products">
            <h2 className="mb-4 text-xl font-semibold">
              4. Products and Services
            </h2>

            <h3 className="mb-3 text-lg font-medium">4.1 Software Licenses</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Before completing a purchase of Digital Products, you must confirm
              that you have read and understood these Terms, our Privacy Policy,
              and (where applicable) the digital content consent presented at
              checkout. This confirmation is required on every purchase.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Upon purchase of Digital Products, you are granted a limited,
              non-exclusive, non-transferable, revocable license to use the
              software for personal or internal business purposes only. You may
              not:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Redistribute, sublicense, sell, or transfer the software to any
                third party.
              </li>
              <li>Reverse engineer, decompile, or disassemble the software.</li>
              <li>Remove or alter any proprietary notices or labels.</li>
              <li>Use the software for any unlawful purpose.</li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">4.2 SaaS Subscriptions</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              SaaS Products provide access to software functionality on a
              subscription basis. You do not acquire ownership of the software;
              you are granted access rights only for the duration of your active
              subscription. Access may be revoked upon subscription termination
              or non-payment.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              4.3 Apparel and Physical Products
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              The following terms apply if and when physical products (such as
              apparel) are offered through the Services. Physical Products are
              sold subject to availability. Product descriptions and images are
              provided for informational purposes. Title and risk of loss pass
              to you upon delivery to the carrier.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Sizing:</strong> All sizing
              information is approximate and provided as a general guide only.
              We recommend consulting our size guides before ordering. Sizing
              may vary between different product lines and manufacturers. We are
              not responsible for items that do not fit as expected if the
              sizing guide was not followed.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Colors and Images:</strong> We
              make every effort to display accurate colors of our products.
              However, actual product colors may vary from images shown due to
              differences in monitor settings, screen resolutions, photography
              lighting, and manufacturing variations. Minor color variations are
              not considered defects.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Care Instructions:</strong>{" "}
              All apparel products come with care instructions. You are
              responsible for following these instructions. Damage resulting
              from improper care, washing, or handling is not covered under our
              return or warranty policies.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">
                Custom and Personalized Items:
              </strong>{" "}
              Custom or personalized products are made specifically for you and
              cannot be returned or exchanged unless they are defective or we
              made an error in production. Please review all customization
              details carefully before placing your order.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Warranty:</strong> Physical
              products are covered by the statutory warranty provisions under
              applicable Swiss law. In Switzerland, the warranty period is 2
              years from delivery (Art. 210 Swiss Code of Obligations). Defects
              that appear within 6 months of delivery are presumed to have
              existed at the time of delivery (burden of proof reversal). This
              does not limit any other rights you may have under applicable
              consumer protection laws.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Delivery:</strong> Delivery
              times vary and are estimated at checkout. We currently ship to
              Switzerland only. Shipping costs are calculated at checkout based
              on destination and order weight. For Swiss deliveries, typical
              delivery time is 2-5 business days. Risk of loss passes to you
              upon delivery to the carrier.
            </p>

            <h3
              id="software-saas-no-warranties"
              className="mb-3 text-lg font-medium"
            >
              4.4 Software, Digital Products and SaaS – No Warranties and No
              Guarantees
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Digital Products and SaaS are provided &quot;as is&quot; and
              &quot;as available&quot;. They may contain defects, errors, bugs,
              or may not operate as intended. We do not guarantee uninterrupted
              or error-free access, any particular uptime, or continuous
              availability. Services may be temporarily unavailable due to
              maintenance, third-party failures, or other reasons.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              We are not obligated to provide updates, upgrades, patches, new
              versions, or new features. Any updates or improvements are at our
              sole discretion. We do not guarantee compatibility with future
              operating systems, browsers, or third-party products or services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              You use our software and SaaS at your own risk. For important
              data, you are responsible for keeping backups; we are not liable
              for loss of data arising from use of our software or services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Where applicable Swiss law grants you mandatory rights (e.g.
              conformity with the contract, statutory remedies), nothing in
              these Terms is intended to exclude or limit those rights. The
              above disclaimers apply to the fullest extent permitted by such
              law.
            </p>
          </section>

          {/* Section 5 - Free Services and Beta Features */}
          <section id="free-services">
            <h2 className="mb-4 text-xl font-semibold">
              5. Free Services and Beta Features
            </h2>

            <h3 className="mb-3 text-lg font-medium">5.1 Free Services</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We may offer certain Services or features at no cost (&quot;Free
              Services&quot;). Free Services are provided &quot;as is&quot;
              without any warranties or guarantees of availability,
              functionality, or support.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              We reserve the right to modify, suspend, or discontinue any Free
              Services at any time, with or without notice. We shall have no
              liability to you or any third party for any modification,
              suspension, or discontinuation of Free Services.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              5.2 Beta and Experimental Features
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              From time to time, we may offer beta, preview, or experimental
              features (&quot;Beta Features&quot;). Beta Features are provided
              for testing and feedback purposes only and may:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                Contain bugs, errors, or other issues that may cause system
                failures or data loss
              </li>
              <li>
                Be modified, suspended, or discontinued at any time without
                notice
              </li>
              <li>
                Not be subject to the same security, performance, or
                availability standards as production features
              </li>
              <li>Be subject to additional terms and conditions</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">
                Use of Beta Features is entirely at your own risk.
              </strong>{" "}
              We strongly recommend maintaining backups of any data used with
              Beta Features. We shall have no liability for any data loss,
              damages, or other issues arising from your use of Beta Features.
            </p>
          </section>

          {/* Section 6 - Acceptable Use Policy */}
          <section id="acceptable-use">
            <h2 className="mb-4 text-xl font-semibold">
              6. Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              You agree to use the Services only for lawful purposes and in
              accordance with these Terms. You agree not to use the Services:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                In any way that violates any applicable federal, state, local,
                or international law or regulation
              </li>
              <li>
                To transmit, or procure the sending of, any advertising or
                promotional material, including any &quot;junk mail,&quot;
                &quot;chain letter,&quot; &quot;spam,&quot; or any similar
                solicitation without our prior written consent
              </li>
              <li>
                To impersonate or attempt to impersonate the Company, a Company
                employee, another user, or any other person or entity
              </li>
              <li>
                To engage in any conduct that restricts or inhibits
                anyone&apos;s use or enjoyment of the Services
              </li>
              <li>
                To harass, abuse, threaten, or intimidate other users or any
                third party
              </li>
              <li>
                To upload, transmit, or distribute any malware, viruses, worms,
                Trojan horses, or other harmful code
              </li>
              <li>
                To attempt to gain unauthorized access to any portion of the
                Services, other accounts, computer systems, or networks
              </li>
              <li>
                To interfere with or disrupt the integrity or performance of the
                Services or the data contained therein
              </li>
              <li>
                To use any automated means (including bots, scrapers, or
                crawlers) to access the Services without our prior written
                permission
              </li>
              <li>
                To circumvent, disable, or otherwise interfere with any
                security-related features of the Services
              </li>
              <li>
                To resell, redistribute, or sublicense access to the Services
                without our prior written authorization
              </li>
              <li>
                To infringe upon the intellectual property rights, privacy
                rights, or other rights of any third party
              </li>
              <li>
                To collect or harvest any personally identifiable information
                from other users
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Violation of this Acceptable Use Policy may result in immediate
              termination of your access to the Services and may expose you to
              civil and/or criminal liability.
            </p>
          </section>

          {/* Section 7 - User Content */}
          <section id="user-content">
            <h2 className="mb-4 text-xl font-semibold">7. User Content</h2>

            <h3 className="mb-3 text-lg font-medium">7.1 Your Content</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Certain features of the Services may allow you to upload, submit,
              store, send, or receive content, including but not limited to
              text, files, images, and other materials (&quot;User
              Content&quot;). You retain ownership of any intellectual property
              rights that you hold in your User Content.
            </p>

            <h3 className="mb-3 text-lg font-medium">7.2 License to Us</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              By uploading or submitting User Content to the Services, you grant
              us a worldwide, non-exclusive, royalty-free license to use,
              reproduce, and display your User Content solely for the technical
              purpose of operating, hosting, and providing the Services (such as
              storage, backup, and content delivery).
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              For end-to-end encrypted content in Helvety Tasks, we have no
              technical ability to access or use your content. This license
              applies only to encrypted data as stored on our infrastructure; we
              cannot and do not access plaintext content.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              7.3 Your Responsibilities
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              You are solely responsible for your User Content and the
              consequences of uploading or publishing it. You represent and
              warrant that:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                You own or have the necessary rights to use and authorize the
                use of your User Content
              </li>
              <li>
                Your User Content does not violate any applicable law,
                regulation, or these Terms
              </li>
              <li>
                Your User Content does not infringe the intellectual property
                rights or other rights of any third party
              </li>
              <li>
                Your User Content does not contain any viruses, malware, or
                other harmful code
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">7.4 Our Rights</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We reserve the right, but have no obligation, to monitor, review,
              or remove User Content at our sole discretion, for any reason or
              no reason, including User Content that we believe violates these
              Terms or is otherwise objectionable.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              7.5 No Liability for User Content
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              We do not endorse, support, represent, or guarantee the
              completeness, truthfulness, accuracy, or reliability of any User
              Content. We shall have no liability for any User Content uploaded
              or posted by users.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              7.6 Encrypted User Content
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Helvety Tasks implements end-to-end encryption. For this service:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                You are solely responsible for maintaining access to your
                passkey. If you lose your passkey and cannot recover it through
                account recovery, your encrypted data may become permanently
                inaccessible.
              </li>
              <li>
                We cannot recover or decrypt your encrypted data on your behalf.
              </li>
              <li>
                We recommend keeping your passkey synced across devices using
                your platform&apos;s passkey synchronization (iCloud Keychain,
                Google Password Manager, etc.).
              </li>
              <li>
                Encrypted data is protected by a zero-knowledge architecture; we
                have no technical ability to access the plaintext content of
                your encrypted data.
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              End-to-end encryption requires a modern browser with WebAuthn PRF
              support (Chrome 128+, Edge 128+, Safari 18+, Firefox 139+ desktop
              only). Firefox for Android does not support encryption features.
            </p>
          </section>

          {/* Section 8 - Online Ordering */}
          <section id="ordering">
            <h2 className="mb-4 text-xl font-semibold">
              8. Online Ordering Process
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              In accordance with Swiss law (UWG/LCD), we provide the following
              information about the technical steps leading to the conclusion of
              a contract:
            </p>

            <h3 className="mb-3 text-lg font-medium">
              8.1 Contract Formation Steps
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              The ordering process consists of the following steps:
            </p>
            <ol className="text-muted-foreground mb-4 list-inside list-decimal space-y-2 text-sm">
              <li>
                Browse our products and select items you wish to purchase.
              </li>
              <li>Add selected items to your shopping cart.</li>
              <li>Review your cart contents, quantities, and prices.</li>
              <li>
                Proceed to checkout and enter your shipping and billing
                information.
              </li>
              <li>Select your preferred payment method.</li>
              <li>
                Review your complete order, including all items, prices, taxes,
                and shipping costs.
              </li>
              <li>
                Read and accept these Terms of Service by checking the required
                checkbox.
              </li>
              <li>
                Click &quot;Confirm Order&quot; or &quot;Place Order&quot; to
                submit your order.
              </li>
            </ol>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Contract Formation:</strong>{" "}
              Your order constitutes an offer to purchase. A binding contract is
              formed when we send you an order confirmation email. We reserve
              the right to reject orders at our discretion (e.g., due to stock
              unavailability, pricing errors, or suspected fraud).
            </p>

            <h3 className="mb-3 text-lg font-medium">
              8.2 Error Detection and Correction
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Before submitting your order, you have the opportunity to detect
              and correct input errors:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                You can modify the contents of your shopping cart at any time
                before checkout.
              </li>
              <li>
                During checkout, you can review and edit your shipping address,
                billing information, and payment method.
              </li>
              <li>
                The order review page displays all order details, allowing you
                to verify everything before final submission.
              </li>
              <li>
                You can use your browser&apos;s back button to return to
                previous steps and make corrections.
              </li>
              <li>
                If you notice an error after submitting your order, contact us
                immediately at contact@helvety.com.
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">8.3 Order Confirmation</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Upon successful submission of your order, you will receive:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>
                An immediate order confirmation email to the email address you
                provided during checkout.
              </li>
              <li>
                The confirmation includes: order number, itemized list of
                products, prices, applicable taxes, shipping address, and
                estimated delivery time (for physical products).
              </li>
              <li>
                For digital products and SaaS subscriptions, access is
                automatically linked to your Helvety account. You can access
                purchased features by signing in with your passkey.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="pricing">
            <h2 className="mb-4 text-xl font-semibold">
              9. Pricing and Payment
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              All prices are displayed in Swiss Francs (CHF). Prices are subject
              to change without notice. All applicable taxes (including Swiss
              VAT where applicable) will be calculated and displayed at
              checkout.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Payment processing is handled by Stripe, Inc. By making a
              purchase, you agree to Stripe&apos;s terms of service. We do not
              store your complete payment card information on our servers.
            </p>
            <p className="text-muted-foreground text-sm">
              You agree to pay all charges incurred by you or any users of your
              account at the prices in effect when such charges are incurred.
              You are responsible for any taxes applicable to your purchases.
            </p>
          </section>

          {/* Section 10 */}
          <section id="subscriptions">
            <h2 className="mb-4 text-xl font-semibold">
              10. Subscription Terms
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Billing Cycles:</strong>{" "}
              Subscriptions are billed in advance on a recurring basis (monthly
              or annually, as selected). Your subscription will automatically
              renew at the end of each billing period unless cancelled.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Auto-Renewal:</strong> By
              subscribing, you authorize us to charge your payment method
              automatically at the start of each billing period. Before each
              renewal, Stripe will charge your payment method and you will
              receive a receipt from Stripe for each renewal charge. You can
              view your subscription status and manage cancellation at{" "}
              <a
                href="https://store.helvety.com/account"
                className="hover:text-foreground underline transition-colors"
              >
                store.helvety.com/account
              </a>
              . You may cancel auto-renewal at any time.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Cancellation:</strong> You may
              cancel your subscription at any time. Cancellation takes effect at
              the end of the current billing period. You will retain access
              until the end of your paid period.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Price Changes:</strong> We
              reserve the right to modify subscription prices. You will be
              notified of any price changes at least 30 days before they take
              effect. Continued use after price changes constitutes acceptance.
            </p>
          </section>

          {/* Section 11 */}
          <section id="refunds">
            <h2 className="mb-4 text-xl font-semibold">11. Refund Policy</h2>

            <h3 className="mb-3 text-lg font-medium">11.1 Digital Products</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Due to the nature of digital goods, all sales of Digital Products
              are final once the product has been delivered or download access
              has been provided. No refunds will be issued for Digital Products
              except where required by applicable law or at our sole discretion.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              11.2 SaaS Subscriptions
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              For subscription cancellations, you will not receive a refund for
              the current billing period but will retain access until its end.
              In exceptional circumstances, we may offer pro-rata refunds at our
              sole discretion.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              11.3 Physical Products (Apparel)
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              While Swiss law does not provide a statutory withdrawal right for
              online purchases, we voluntarily offer a 14-day return policy for
              physical products as a gesture of goodwill.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              To exercise this right, you must inform us of your decision to
              return the goods by a clear statement (e.g., email to
              contact@helvety.com). Products must be returned in their original
              condition, unworn and with all tags attached. You bear the cost of
              returning the goods.
            </p>
            <p className="text-muted-foreground text-sm">
              Refunds will be processed within 14 days of receiving the returned
              items using the same payment method used for the original
              purchase.
            </p>
          </section>

          {/* Section 12 */}
          <section id="ip">
            <h2 className="mb-4 text-xl font-semibold">
              12. Intellectual Property
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              All Content on the Services, including but not limited to
              software, text, graphics, logos, images, audio, video, and the
              compilation thereof, is the exclusive property of Helvety by Rubin
              or its licensors and is protected by Swiss and international
              copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              The Helvety name, logo, and all related names, logos, product and
              service names, designs, and slogans are trademarks of Helvety by
              Rubin. You may not use such marks without our prior written
              permission.
            </p>
            <p className="text-muted-foreground text-sm">
              Nothing in these Terms grants you any right, title, or interest in
              any intellectual property owned by us, except for the limited
              license rights expressly granted herein.
            </p>
          </section>

          {/* Section 13 */}
          <section id="liability">
            <h2 className="mb-4 text-xl font-semibold">
              13. Limitation of Liability
            </h2>
            <div className="border-border bg-card mb-4 border p-4">
              <p className="text-muted-foreground text-sm font-semibold uppercase">
                PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY TO
                YOU.
              </p>
            </div>

            <h3 className="mb-3 text-lg font-medium">
              13.1 Disclaimer of Warranties
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              THE SERVICES AND ALL PRODUCTS ARE PROVIDED &quot;AS IS&quot; AND
              &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE
              LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT
              NOT LIMITED TO:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
            </ul>
            <p className="text-muted-foreground mb-4 text-sm">
              In particular, we do not warrant that our software, digital
              products, or SaaS will be free of errors, bugs, or interruptions,
              or that we will provide any updates or new versions.
            </p>

            <h3 className="mb-3 text-lg font-medium">
              13.2 Limitation of Damages
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
              SHALL HELVETY BY RUBIN, ITS OWNER, AFFILIATES, OR SERVICE
              PROVIDERS BE LIABLE FOR ANY:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
              <li>
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES
              </li>
              <li>LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
              <li>COST OF SUBSTITUTE GOODS OR SERVICES</li>
              <li>
                DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICES
              </li>
              <li>
                DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO OR ALTERATION OF
                YOUR DATA
              </li>
            </ul>

            <h3 className="mb-3 text-lg font-medium">13.3 Maximum Liability</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS
              ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT
              EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT YOU HAVE PAID TO US IN
              THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE
              TO THE CLAIM, OR (B) ONE HUNDRED SWISS FRANCS (CHF 100).
            </p>

            <h3 className="mb-3 text-lg font-medium">
              13.4 Assumption of Risk
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              You expressly acknowledge and agree that your use of the Services
              is at your sole risk. You assume full responsibility for all risks
              associated with your use of any products purchased through the
              Services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Nothing in these Terms excludes or limits our liability for death
              or personal injury caused by our negligence, fraud or wilful
              misconduct, or for breach of such obligations as cannot lawfully
              be limited under applicable law (e.g. Swiss mandatory provisions).
            </p>

            <h3 className="mb-3 text-lg font-medium">13.5 Force Majeure</h3>
            <p className="text-muted-foreground text-sm">
              We shall not be liable for any failure or delay in performing our
              obligations where such failure or delay results from circumstances
              beyond our reasonable control, including but not limited to: acts
              of God, natural disasters, war, terrorism, riots, embargoes, acts
              of civil or military authorities, fire, floods, accidents,
              strikes, pandemic, or shortages of transportation, facilities,
              fuel, energy, labor, or materials.
            </p>
          </section>

          {/* Section 14 */}
          <section id="indemnification">
            <h2 className="mb-4 text-xl font-semibold">14. Indemnification</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              You agree to defend, indemnify, and hold harmless Helvety by
              Rubin, its owner, employees, agents, and service providers from
              and against any and all claims, damages, obligations, losses,
              liabilities, costs, and expenses (including but not limited to
              attorney&apos;s fees) arising from:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>Your use of and access to the Services</li>
              <li>Your violation of any provision of these Terms</li>
              <li>
                Your violation of any third-party right, including any
                intellectual property, privacy, or proprietary right
              </li>
              <li>
                Any claim that your use of the Services caused damage to a third
                party
              </li>
              <li>Your breach of any applicable law or regulation</li>
            </ul>
          </section>

          {/* Section 15 */}
          <section id="termination">
            <h2 className="mb-4 text-xl font-semibold">15. Termination</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We may terminate or suspend your account and access to the
              Services for cause, including but not limited to: breach of these
              Terms, fraudulent activity, non-payment, illegal use, or prolonged
              inactivity. We will provide reasonable notice (minimum 30 days)
              except in cases of serious breach requiring immediate action.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Upon termination, your right to use the Services will immediately
              cease. All provisions of these Terms which by their nature should
              survive termination shall survive, including but not limited to:
              intellectual property provisions, warranty disclaimers, limitation
              of liability, and indemnification.
            </p>
            <p className="text-muted-foreground text-sm">
              You may terminate your account at any time by contacting us at
              contact@helvety.com. Account termination does not entitle you to
              any refund of fees already paid.
            </p>
          </section>

          {/* Section 16 */}
          <section id="governing">
            <h2 className="mb-4 text-xl font-semibold">
              16. Governing Law and Jurisdiction
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              These Terms shall be governed by and construed in accordance with
              the substantive laws of Switzerland, without regard to its
              conflict of law provisions.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Any disputes arising out of or relating to these Terms or the
              Services shall be subject to the exclusive jurisdiction of the
              courts of Basel-Stadt, Switzerland.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Language:</strong> These Terms
              are drafted in English. In the event of any discrepancy between
              this English version and any translation, the English version
              shall prevail.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Severability:</strong> If any
              provision of these Terms is held to be invalid or unenforceable,
              such provision shall be struck and the remaining provisions shall
              remain in full force and effect.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Entire Agreement:</strong>{" "}
              These Terms, together with our Privacy Policy and any other
              agreements expressly incorporated by reference herein, constitute
              the entire agreement between you and Helvety by Rubin concerning
              the Services. These Terms supersede all prior or contemporaneous
              communications, whether electronic, oral, or written, between you
              and us regarding the Services.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">No Waiver:</strong> Our
              failure to enforce any right or provision of these Terms shall not
              constitute a waiver of such right or provision. Any waiver of any
              provision of these Terms will be effective only if in writing and
              signed by us.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Assignment:</strong> You may
              not assign or transfer these Terms, by operation of law or
              otherwise, without our prior written consent. Any attempt by you
              to assign or transfer these Terms without such consent will be
              null and void. We may freely assign or transfer these Terms
              without restriction. Subject to the foregoing, these Terms will
              bind and inure to the benefit of the parties, their successors,
              and permitted assigns.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Notices:</strong> Any notices
              or other communications provided by us under these Terms will be
              given: (i) via email to the email address associated with your
              account; or (ii) by posting to the Services. For notices made by
              email, the date of receipt will be deemed the date on which such
              notice is transmitted. You may give us notice by email to
              contact@helvety.com or by mail to our address listed in the
              Contact section.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              <strong className="text-foreground">Export Compliance:</strong>{" "}
              You agree to comply with all applicable export and re-export
              control laws and regulations, including the Swiss State
              Secretariat for Economic Affairs (SECO) regulations, the US Export
              Administration Regulations (EAR), and sanctions programs
              administered by relevant authorities. You may not download or use
              the Services if you are located in a country or region subject to
              comprehensive sanctions, or if you are on any government list of
              prohibited or restricted parties.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Headings:</strong> The section
              headings in these Terms are for convenience only and have no legal
              or contractual effect.
            </p>
          </section>

          {/* Section 17 */}
          <section id="changes">
            <h2 className="mb-4 text-xl font-semibold">17. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We reserve the right to modify or replace these Terms at any time
              at our sole discretion. If a revision is material, we will provide
              at least 30 days&apos; notice prior to any new terms taking
              effect. What constitutes a material change will be determined at
              our sole discretion.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              By continuing to access or use the Services after any revisions
              become effective, you agree to be bound by the revised Terms.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              If you do not agree to the revised Terms, you may terminate your
              account and stop using the Services. We will not retroactively
              apply material changes to purchases or subscriptions made before
              the changes took effect.
            </p>
          </section>

          {/* Section 18 */}
          <section id="contact">
            <h2 className="mb-4 text-xl font-semibold">
              18. Contact Information
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              For any questions about these Terms, please contact us:
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
              By using Helvety services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
