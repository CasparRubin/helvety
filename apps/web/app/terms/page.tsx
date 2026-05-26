import { CONTACT_EMAIL, urls } from "@helvety/shared/config";

import "@/app/legal.css";
import {
  LegalCard,
  LegalFooterNote,
  LegalHeader,
  LegalPageShell,
  LegalToc,
} from "@/components/legal-document";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Helvety",
  description: "Terms of Service for Helvety products and apps",
  alternates: {
    canonical: `${urls.home}/terms`,
  },
};

/** Terms of Service page for Helvety */
export default function TermsPage() {
  return (
    <LegalPageShell>
      <LegalHeader title="Terms of Service" lastReviewed="May 26, 2026" />

      {/* Table of Contents */}
      <LegalToc>
        <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
        <ol className="text-muted-foreground list-outside list-decimal space-y-1 pl-5 text-sm">
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
                  4.4 Software and Digital Products - No Warranties and No
                  Guarantees
                </a>
              </li>
              <li>
                <a
                  href="#enterprise-extensions"
                  className="hover:text-foreground transition-colors"
                >
                  4.5 Software extensions and downloadable packages
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
              Access and Download Process
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Free Access Model
            </a>
          </li>
          <li>
            <a
              href="#product-access"
              className="hover:text-foreground transition-colors"
            >
              Product Access and Availability
            </a>
          </li>
          <li>
            <a
              href="#refunds"
              className="hover:text-foreground transition-colors"
            >
              Charges and Refunds
            </a>
          </li>
          <li>
            <a href="#ip" className="hover:text-foreground transition-colors">
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
      </LegalToc>

      {/* Section 1 */}
      <section id="acceptance" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          By accessing or using any Helvety services, websites, or applications
          (&quot;the Services&quot;), operated by Helvety by Rubin
          (&quot;we,&quot; &quot;us,&quot; or &quot;the Company&quot;), you
          agree to be bound by these Terms of Service (&quot;Terms&quot;). If
          you do not agree to these Terms, do not use the Services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          The Services are primarily intended for customers located in
          Switzerland, and we do not actively target EU/EEA markets at this
          time. Service availability may be restricted for users in certain
          regions, including the European Union (EU) and European Economic Area
          (EEA). Sign-in for account-based services includes a location
          attestation step (confirmation that the user is not located in the
          EU/EEA) before verification-code delivery, but this is not equivalent
          to strict geoblocking. Access from outside Switzerland may still
          occur; in such cases, you remain responsible for compliance with
          applicable local law, and mandatory consumer/data-protection rules in
          your jurisdiction may still apply.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          These Terms constitute a legally binding agreement between you and
          Helvety by Rubin, a sole proprietorship (Einzelfirma) registered in
          Switzerland.
        </p>
        <p className="text-muted-foreground text-sm">
          Your continued use of the Services following the posting of any
          changes to these Terms constitutes acceptance of those changes.
        </p>
      </section>

      {/* Section 2 */}
      <section id="definitions" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">2. Definitions</h2>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">&quot;Services&quot;</strong>{" "}
            refers to all Helvety websites, applications, platforms, and related
            services.
          </li>
          <li>
            <strong className="text-foreground">
              &quot;User,&quot; &quot;you,&quot; or &quot;your&quot;
            </strong>{" "}
            refers to any individual or entity accessing or using the Services.
          </li>
          <li>
            <strong className="text-foreground">
              &quot;Digital Products&quot;
            </strong>{" "}
            refers to software, digital downloads, and other non-physical goods.
          </li>
          <li>
            <strong className="text-foreground">
              &quot;Account-Based Products&quot;
            </strong>{" "}
            refers to Helvety applications that require an account for access.
          </li>
          <li>
            <strong className="text-foreground">&quot;Content&quot;</strong>{" "}
            refers to all materials, including but not limited to software,
            text, images, and designs.
          </li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="account" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">3. Account Registration</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          To access certain features of the Services, you must create an
          account. Account creation requires your email address and passkey
          setup. During registration, new users must first confirm that they are
          not located in the EU/EEA; this confirmation is required before a new
          account is created. After confirmation, all users complete email
          verification-code authentication. Existing users then continue with
          passkey sign-in, while first-time users complete passkey setup. On
          return visits from the same browser, after prior email verification,
          sign-in may begin at passkey confirmation without asking for your
          email again until you sign out or the trusted-device cookie expires
          (passkey is still required). You then authenticate using your
          device&apos;s biometrics (Face ID, fingerprint, or PIN) to set up or
          use your passkey.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          By creating an account, you agree to:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Provide a valid email address that you have access to.</li>
          <li>
            Maintain the security of your passkey and the device(s) on which it
            is stored.
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
          <strong className="text-foreground">Account Recovery:</strong> If you
          lose access to your passkey, you can request a new verification code
          sent to your registered email address to re-authenticate and set up a
          new passkey. This restores account sign-in only and does not recover
          previously encrypted data. We recommend keeping your passkeys synced
          in your platform&apos;s built-in password app (for example, iCloud
          Keychain or Google Password Manager).
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Encryption Setup:</strong> Once
          you authenticate into Helvety Tasks, Helvety Contacts, Helvety Notes,
          or Helvety Links, you must configure an encryption passkey so those
          apps can protect your content with end-to-end encryption. This uses
          the WebAuthn PRF (Pseudo-Random Function) extension to derive
          encryption keys on your device. The encryption keys are not
          transmitted to or stored on our servers. If you lose access to your
          encryption passkey, encrypted content will become permanently
          inaccessible. Certain non-encrypted structural metadata is stored in
          plaintext to enable application functionality; the specific fields
          depend on the product (for example, sort order and folder parent/child
          relationships in Helvety Links, or priority levels and stage/label
          references in Helvety Tasks). See our Privacy Policy for field-level
          details. Other Helvety services (helvety.com, Helvety Auth, Helvety
          PDF, Helvety Image Upscaler, Helvety Store) do not use full-app
          end-to-end encryption. Helvety Docs supports optional client-side
          encrypted vault storage for saved documents when you sign in and
          unlock; local editing without an account does not use that vault.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Age Requirement:</strong> You must
          be at least 18 years of age to create an account and use the Services.
          By creating an account, you represent and warrant that you are at
          least 18 years old.
        </p>
        <p className="text-muted-foreground text-sm">
          We may suspend or terminate accounts for cause, including violations
          of these Terms, unlawful use, abuse, fraud, or security risks. Where
          reasonably practicable, we provide prior notice; immediate action may
          be taken where notice is legally restricted or would increase risk to
          users, third parties, or our Services (see Section 15).
        </p>
      </section>

      {/* Section 4 */}
      <section id="products" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">4. Products and Services</h2>

        <h3 className="mb-3 text-lg font-medium">4.1 Software Licenses</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Where a product or access flow presents an explicit legal acceptance
          step, you must confirm that you have read and understood these Terms
          and our Privacy Policy before continuing. Access to product downloads
          and account-based apps is governed by these Terms.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Source code published in our official public repositories for Helvety
          products (including this website, browser extensions, SharePoint
          solutions, and desktop tools) is licensed under the GNU Affero General
          Public License version 3 (AGPL-3.0) or later. Your rights to use,
          study, modify, and share that source code are governed by the
          applicable repository LICENSE file, including copyleft obligations
          when you convey modified versions or offer the software as a network
          service.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          These Terms govern the use of our hosted services, websites, account
          features, and product delivery flows. They do not reduce or override
          rights or obligations under the applicable open-source license for
          repository source code.
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>Use software and services only for lawful purposes.</li>
          <li>
            Keep copyright and license notices intact where required by the
            applicable open-source license.
          </li>
          <li>
            Respect Helvety trademarks, logos, and brand assets as described in
            these Terms.
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          4.2 Account-Based Product Access
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Account-Based Products provide access to software functionality
          through your Helvety account. You do not acquire ownership of the
          software; you receive limited access rights subject to these Terms.
          Access may be restricted or revoked for violations of these Terms,
          abuse, or security reasons.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          4.3 Apparel and Physical Products (If and When Offered)
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety currently does not offer physical products through its apps.
          If this changes in the future, applicable legal terms will be
          published before such offerings become available.
        </p>

        <h3
          id="software-saas-no-warranties"
          className="mt-8 mb-3 text-lg font-medium"
        >
          4.4 Software and Digital Products - No Warranties and No Guarantees
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Digital Products are provided &quot;as is&quot; and &quot;as
          available&quot;. They may contain defects, errors, bugs, or may not
          operate as intended. We do not guarantee uninterrupted or error-free
          access, any particular uptime, or continuous availability. Services
          may be temporarily unavailable due to maintenance, third-party
          failures, or other reasons.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          We are not obligated to provide updates, upgrades, patches, new
          versions, or new features. Any updates or improvements are at our sole
          discretion. We do not guarantee compatibility with future operating
          systems, browsers, or third-party products or services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          You use our software at your own risk. For important data, you are
          responsible for keeping backups; we are not liable for loss of data
          arising from use of our software or services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Where applicable Swiss law grants you mandatory rights (e.g.
          conformity with the contract, statutory remedies), nothing in these
          Terms is intended to exclude or limit those rights. The above
          disclaimers apply to the fullest extent permitted by such law.
        </p>

        <h3 id="enterprise-extensions" className="mb-3 text-lg font-medium">
          4.5 Software extensions and downloadable packages
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Certain products are distributed as browser extensions (including via
          the Chrome Web Store), downloadable packages (for example Helvety SPO
          Explorer for SharePoint Online), or desktop installers (for example
          Helvety Screen Tools for Windows). Power Platform Configurator is
          offered for supported Chromium-based browsers through the Chrome Web
          Store. The following additional terms apply to these products:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Availability:</strong>{" "}
            Distribution method, eligibility criteria, and support scope are
            described on the relevant product page.
          </li>
          <li>
            <strong className="text-foreground">Deployment context:</strong> You
            remain responsible for deploying and configuring them in line with
            Microsoft or browser-vendor guidance, your organization&apos;s
            governance rules (where applicable), and the instructions on the
            relevant product page.
          </li>
          <li>
            <strong className="text-foreground">Support:</strong> Support
            channels and response expectations are described on the relevant
            product page.
          </li>
          <li>
            <strong className="text-foreground">Third-party contexts:</strong>{" "}
            Some products run in third-party environments (for example Microsoft
            365 tenant context, Power Automate hosts, browser extension runtime,
            or Windows OS integration). You are responsible for compliance with
            third-party terms, policies, and your organizational governance.
          </li>
          <li>
            <strong className="text-foreground">
              Local-data responsibility:
            </strong>{" "}
            For local-processing products (for example Screen Tools), you are
            responsible for handling sensitive files, clipboard content, and
            local storage on your own device. Helvety cannot recover local data
            that is not synchronized to Helvety services.
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          4.6 AI-assisted tools (including Helvety Image Upscaler)
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Certain Services use AI-assisted processing. For Helvety Image
          Upscaler, image transformation runs in your browser under the current
          architecture. We do not guarantee that outputs will be accurate,
          visually improved, fit for a specific purpose, or free from artifacts
          in every case.
        </p>
        <p className="text-muted-foreground text-sm">
          You are responsible for reviewing outputs before relying on them in
          production, professional, legal, safety-critical, or compliance
          contexts.
        </p>
      </section>

      {/* Section 5 - Free Services and Beta Features */}
      <section id="free-services" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          5. Free Services and Beta Features
        </h2>

        <h3 className="mb-3 text-lg font-medium">5.1 Free Services</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We may offer certain Services or features at no cost (&quot;Free
          Services&quot;). Free Services are provided &quot;as is&quot; without
          any warranties or guarantees of availability, functionality, or
          support.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          We reserve the right to modify, suspend, or discontinue any Free
          Services at any time. Where reasonably practicable, we provide at
          least 30 days&apos; prior notice; immediate changes may occur for
          security, legal, or abuse-prevention reasons. To the extent permitted
          by applicable law, we shall have no liability to you or any third
          party for modification, suspension, or discontinuation of Free
          Services.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          5.2 Beta and Experimental Features
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          From time to time, we may offer beta, preview, or experimental
          features (&quot;Beta Features&quot;). Beta Features are provided for
          testing and feedback purposes only and may:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Contain bugs, errors, or other issues that may cause system failures
            or data loss
          </li>
          <li>
            Be modified, suspended, or discontinued at any time without notice
          </li>
          <li>
            Not be subject to the same security, performance, or availability
            standards as production features
          </li>
          <li>Be subject to additional terms and conditions</li>
        </ul>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">
            Use of Beta Features is entirely at your own risk.
          </strong>{" "}
          We strongly recommend maintaining backups of any data used with Beta
          Features. We shall have no liability for any data loss, damages, or
          other issues arising from your use of Beta Features.
        </p>
      </section>

      {/* Section 6 - Acceptable Use Policy */}
      <section id="acceptable-use" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">6. Acceptable Use Policy</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          You agree to use the Services only for lawful purposes and in
          accordance with these Terms. You agree not to use the Services:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            In any way that violates applicable Swiss law or any other mandatory
            law or regulation applicable to your use of the Services
          </li>
          <li>
            To store, upload, transmit, or distribute child sexual abuse
            material (CSAM) or any content that sexualizes minors, in violation
            of Swiss Criminal Code Art. 197
          </li>
          <li>
            To store, upload, transmit, or distribute depictions of extreme
            violence against human beings or animals without justifiable
            cultural or scientific purpose, in violation of Swiss Criminal Code
            Art. 135
          </li>
          <li>
            To use the Services for any activity that constitutes a criminal
            offense under Swiss law, including but not limited to fraud, money
            laundering, terrorist financing, or the distribution of prohibited
            content
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
            To engage in any conduct that restricts or inhibits anyone&apos;s
            use or enjoyment of the Services
          </li>
          <li>
            To harass, abuse, threaten, or intimidate other users or any third
            party
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
            To use any automated means (including bots, scrapers, or crawlers)
            to access the Services without our prior written permission, except
            for search indexing and bot access explicitly permitted by our
            robots.txt rules
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
            To infringe upon the intellectual property rights, privacy rights,
            or other rights of any third party
          </li>
          <li>
            To collect or harvest any personally identifiable information from
            other users
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            End-to-end encryption does not exempt you from legal responsibility.
          </strong>{" "}
          You remain solely responsible for the legality of all content you
          store using the Services, regardless of whether that content is
          encrypted.
        </p>
        <p className="text-muted-foreground text-sm">
          Violation of this Acceptable Use Policy may result in immediate
          termination of your access to the Services and may expose you to civil
          and/or criminal liability.
        </p>
        <p className="text-muted-foreground mt-4 text-sm">
          For AI-assisted tools (including Helvety Image Upscaler), you also
          agree not to use the Services to create or distribute unlawful,
          deceptive, rights-infringing, or harmful synthetic media, including
          deepfake content intended to impersonate individuals or mislead
          others.
        </p>
      </section>

      {/* Section 7 - User Content */}
      <section id="user-content" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">7. User Content</h2>

        <h3 className="mb-3 text-lg font-medium">7.1 Your Content</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Certain features of the Services may allow you to submit, store, send,
          or receive content (&quot;User Content&quot;). User Content can
          include text and other account-related data used by the Services. You
          retain ownership of any intellectual property rights that you hold in
          your User Content.
        </p>

        <h3 className="mb-3 text-lg font-medium">7.2 License to Us</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          By submitting User Content to the Services, you grant us a worldwide,
          non-exclusive, royalty-free license to use, reproduce, and display
          your User Content solely for the technical purpose of operating,
          hosting, and providing the Services (such as storage, backup, and
          content delivery).
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          For local-processing tools such as Helvety Image Upscaler, this
          license does not grant us rights to train machine-learning models on
          your image pixels. Under the current architecture, image upscaling is
          designed to run on your device and not as a server-side model-training
          pipeline.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          For end-to-end encrypted content in Helvety Tasks, Helvety Contacts,
          Helvety Notes, and Helvety Links, our systems are designed to prevent
          routine access to plaintext content. This license applies to encrypted
          data as stored on our infrastructure.
        </p>

        <h3 className="mb-3 text-lg font-medium">7.3 Your Responsibilities</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          You are solely responsible for your User Content and the consequences
          of submitting or publishing it. You represent and warrant that:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            You own or have the necessary rights to use and authorize the use of
            your User Content
          </li>
          <li>
            For local image files processed through Helvety Image Upscaler, you
            have the rights or permissions needed for the source image and any
            generated output you use or distribute
          </li>
          <li>
            Your User Content does not violate any applicable law, regulation,
            or these Terms
          </li>
          <li>
            Your User Content does not infringe the intellectual property rights
            or other rights of any third party
          </li>
          <li>
            Your User Content does not contain any viruses, malware, or other
            harmful code
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">7.4 Our Rights</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We reserve the right, but have no obligation, to restrict or remove
          User Content where technically possible and legally required,
          including content that we believe violates these Terms or applicable
          law.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          For end-to-end encrypted content in Helvety Tasks, Helvety Contacts,
          Helvety Notes, and Helvety Links, we generally cannot review plaintext
          content. In those cases, enforcement may rely on metadata, user
          reports, and valid legal orders.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          We may immediately suspend or terminate accounts and delete all
          associated account data upon receipt of a valid Swiss court order or
          if we reasonably believe an account is being used for illegal
          activity. In such cases:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Suspension may be imposed without advance notice where required by
            law or where notice would compromise an investigation
          </li>
          <li>
            Suspended accounts will have stored account data frozen where
            legally and operationally required
          </li>
          <li>
            Upon account termination, core account database records are
            processed for permanent deletion immediately; full propagation may
            still require technical processing time and legally required
            retention windows
          </li>
          <li>
            No monetary compensation applies in the event of suspension or
            termination for cause, except where mandatory law requires otherwise
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">
          7.5 No Liability for User Content
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          We do not endorse, support, represent, or guarantee the completeness,
          truthfulness, accuracy, or reliability of any User Content. We shall
          have no liability for any User Content submitted or posted by users.
        </p>

        <h3 className="mb-3 text-lg font-medium">7.6 Encrypted User Content</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety Tasks, Helvety Contacts, Helvety Notes, and Helvety Links
          implement end-to-end encryption. For these services:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            You are solely responsible for maintaining access to your passkey.
            If you lose your passkey, encrypted data cannot be recovered.
          </li>
          <li>
            We cannot recover, decrypt, or restore encrypted data on your
            behalf.
          </li>
          <li>
            We recommend keeping your passkey synced across devices using your
            platform&apos;s passkey synchronization (iCloud Keychain, Google
            Password Manager, etc.).
          </li>
          <li>
            Encrypted data is protected by a zero-knowledge-oriented
            architecture; our systems are designed so we are generally unable to
            access the plaintext content of your encrypted data during normal
            operation.
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          End-to-end encryption requires a modern browser with WebAuthn PRF
          support. Browser compatibility can change over time; refer to the
          current product documentation for supported platforms.
        </p>

        <h3 className="mt-8 mb-3 text-lg font-medium">
          7.7 Law Enforcement Cooperation
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety cooperates with Swiss law enforcement authorities when
          presented with valid Swiss court orders or binding legal requests
          issued in accordance with applicable Swiss law. We will cooperate with
          any lawful surveillance order directed at us, including under the
          Swiss Federal Act on the Surveillance of Post and Telecommunications
          (BÜPF) to the extent it applies to our services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Due to our zero-knowledge-oriented architecture, we are generally
          unable to decrypt or provide plaintext end-to-end encrypted data
          during normal operation. However, we may provide the following
          non-encrypted metadata in response to valid legal requests:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            Account information (email address, account creation date, internal
            identifiers)
          </li>
          <li>IP addresses and timestamps associated with account activity</li>
          <li>
            Technical account activity metadata retained for security and abuse
            prevention
          </li>
          <li>Product access and download audit metadata</li>
          <li>
            Non-encrypted structural metadata from Helvety Tasks, Helvety
            Contacts, Helvety Notes, and Helvety Links. Depending on the app,
            this may include record identifiers, timestamps, and display
            preferences such as sort order; for Helvety Tasks, priority levels
            and stage/label references; for Helvety Contacts and Helvety Notes,
            immutable built-in category references and, where cross-app linking
            is enabled, relationship metadata between entities; for Helvety
            Links, folder parent/child relationships
          </li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          Upon receipt of a valid Swiss court order, we may immediately suspend
          or terminate the account in question. Suspension can include freezing
          stored account data where legally and operationally required. Account
          data is processed for permanent deletion upon account termination,
          subject to technical processing time and legally required retention.
          Limited non-content security/compliance metadata may be retained for
          defined periods (including up to 10 years for contract/accounting
          evidence where legally required) as described in the Privacy Policy.
        </p>
        <p className="text-muted-foreground text-sm">
          We are under no obligation to provide advance notice to users when
          acting on valid legal orders, where such notice is prohibited by law
          or would compromise an ongoing investigation. Where legally permitted,
          we will notify affected users of legal requests concerning their
          accounts.
        </p>
      </section>

      {/* Section 8 - Access and Downloads */}
      <section id="ordering" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          8. Access and Download Process
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          In accordance with Swiss law (UWG/LCD), we provide the following
          information about the technical steps leading to the conclusion of a
          contract:
        </p>

        <h3 className="mb-3 text-lg font-medium">
          8.1 Contract Formation Steps
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The access flow consists of the following steps:
        </p>
        <ol className="text-muted-foreground mb-4 list-inside list-decimal space-y-2 text-sm">
          <li>
            Browse our product catalog and select the product you want to access
            or download.
          </li>
          <li>
            Start access from the product page (for example by opening an app,
            installing a browser extension from the Chrome Web Store, or
            requesting a package download).
          </li>
          <li>
            Where a flow presents explicit legal acceptance, confirm the Terms
            of Service and Privacy Policy before continuing.
          </li>
          <li>
            For Store-hosted downloadable packages (for example SharePoint
            .sppkg files), a secure, short-lived download URL is generated.
          </li>
          <li>
            Download the package and deploy or use it according to the product
            documentation. Browser extensions installed from the Chrome Web
            Store follow the store install flow described on the product page.
          </li>
          <li>
            For account-based apps, sign in with your passkey to access data.
          </li>
        </ol>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Contract Formation:</strong> Your
          request to access a product constitutes an offer to use the service
          under these Terms. Access is granted when provisioning or download URL
          generation succeeds. We reserve the right to reject or cancel access
          requests before provisioning (for example due to compliance checks or
          suspected abuse).
        </p>

        <h3 className="mb-3 text-lg font-medium">
          8.2 Error Detection and Correction
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Before finalizing access, you have the opportunity to detect and
          correct input errors:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            You can cancel the access flow and return to the product page at any
            time before completion.
          </li>
          <li>
            You can review product details and account context before
            continuing.
          </li>
          <li>
            You can use your browser&apos;s back button or close the flow to
            cancel before completion.
          </li>
          <li>
            If you notice an error after completion, contact us immediately at{" "}
            {CONTACT_EMAIL}.
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">8.3 Access Confirmation</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Upon successful completion of access, you should receive:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>
            For account-based actions, confirmation via in-app state and/or
            service notifications.
          </li>
          <li>For downloads, a valid generated URL and package metadata.</li>
          <li>
            For digital products, access is linked to the relevant
            customer/account context. Where an active Helvety account is
            required for use, you access features by signing in with your
            passkey.
          </li>
        </ul>
      </section>

      {/* Section 9 */}
      <section id="pricing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">9. Free Access Model</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety services are provided at no monetary cost. We do not operate
          paid tiers, subscriptions, checkout flows, or recurring billing for
          Helvety apps.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          No business/account quotas are applied to Tasks, Contacts, Notes, and
          Links. Technical and security safeguards may still apply to protect
          platform reliability, availability, and abuse prevention.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          You remain responsible for lawful use of the Services and for
          compliance with any obligations applicable in your jurisdiction.
        </p>
        <h3 className="mb-3 text-lg font-medium">
          9.1 Product Access Characteristics
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Product pages describe technical access requirements and product
          behavior:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong className="text-foreground">Helvety PDF</strong> ships a
            default experience that never asks you to log in for routine PDF
            edits.
          </li>
          <li>
            <strong className="text-foreground">Helvety Image Upscaler</strong>{" "}
            likewise runs in a no-account mode for its standard upscaling flow.
          </li>
          <li>
            <strong className="text-foreground">Helvety Docs</strong> edits
            .docx files locally without an account; optional vault save requires
            authenticated access and passkey-backed encryption setup.
          </li>
          <li>
            <strong className="text-foreground">Helvety Store</strong> mixes
            SaaS listings with downloadable artifacts; public package downloads
            (for example SharePoint .sppkg files) and browser extensions
            installed from the Chrome Web Store stay reachable without signing
            in unless a particular workflow says otherwise.
          </li>
          <li>
            <strong className="text-foreground">
              Helvety Tasks, Helvety Contacts, Helvety Notes, and Helvety Links
            </strong>{" "}
            gate every session behind authenticated access plus passkey-backed
            controls.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          All services remain subject to the warranty and liability disclaimers
          in these Terms (see Section 4.4 and Section 13).
        </p>
      </section>

      {/* Section 10 */}
      <section id="product-access" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          10. Product Access and Availability
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Availability:</strong> Helvety
          products are generally available free of charge, subject to technical
          operation and security safeguards.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Account Controls:</strong> You can
          manage account-level controls at{" "}
          <a
            href={`${urls.store}/account`}
            className="hover:text-foreground underline transition-colors"
          >
            helvety.com/store/account
          </a>
          .
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">No Billing Model:</strong> Helvety
          apps do not use paid plans, subscriptions, or payment processing.
        </p>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Availability:</strong> We may
          modify, suspend, or discontinue product availability for security,
          legal, operational, or abuse-prevention reasons.
        </p>
      </section>

      {/* Section 11 */}
      <section id="refunds" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">11. Charges and Refunds</h2>

        <h3 className="mb-3 text-lg font-medium">11.1 Digital Products</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Helvety apps and digital services are provided free of charge. No
          purchase transaction is required to access supported features.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Because no monetary charge applies, refund processing does not apply
          to normal app usage.
        </p>

        <h3 className="mb-3 text-lg font-medium">
          11.2 Account-Based Services
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Where account-based services are used, they remain free and subject to
          these Terms, including service suspension/termination rights for
          security, legal, and abuse-prevention reasons.
        </p>
      </section>

      {/* Section 12 */}
      <section id="ip" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          12. Intellectual Property
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Except where explicitly licensed otherwise, content on the Services
          (including text, graphics, logos, images, audio, video, and related
          compilations) is owned by Helvety by Rubin or its licensors and is
          protected by Swiss and international copyright, trademark, and other
          intellectual property laws. Source code published in our official
          public repositories for Helvety products is licensed under the GNU
          Affero General Public License version 3 (AGPL-3.0) or later.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          The Helvety name, logo, and all related names, logos, product and
          service names, designs, and slogans are trademarks of Helvety by
          Rubin. You may not use such marks without our prior written
          permission.
        </p>
        <p className="text-muted-foreground text-sm">
          Nothing in these Terms limits rights expressly granted by applicable
          open-source licenses (including AGPL-3.0) for repository source code.
          Trademark and brand usage rights remain separate and are not granted
          unless expressly stated.
        </p>
      </section>

      {/* Section 13 */}
      <section id="liability" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          13. Limitation of Liability
        </h2>
        <LegalCard className="mb-4 p-4">
          <p className="text-muted-foreground text-sm font-semibold uppercase">
            PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY TO
            YOU.
          </p>
        </LegalCard>

        <h3 className="mb-3 text-lg font-medium">
          13.1 Disclaimer of Warranties
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          THE SERVICES AND ALL PRODUCTS ARE PROVIDED &quot;AS IS&quot; AND
          &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
          EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW,
          WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
          <li>FITNESS FOR A PARTICULAR PURPOSE</li>
          <li>NON-INFRINGEMENT</li>
          <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
          <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
        </ul>
        <p className="text-muted-foreground mb-4 text-sm">
          In particular, we do not warrant that our software or digital products
          will be free of errors, bugs, or interruptions, or that we will
          provide any updates or new versions.
        </p>

        <h3 className="mb-3 text-lg font-medium">13.2 Limitation of Damages</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          HELVETY BY RUBIN, ITS OWNER, AFFILIATES, OR SERVICE PROVIDERS BE
          LIABLE FOR ANY:
        </p>
        <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2 text-sm">
          <li>
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
          </li>
          <li>LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
          <li>COST OF SUBSTITUTE GOODS OR SERVICES</li>
          <li>
            DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICES
          </li>
          <li>
            DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR
            DATA
          </li>
        </ul>

        <h3 className="mb-3 text-lg font-medium">13.3 Maximum Liability</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR TOTAL
          CUMULATIVE LIABILITY FOR CLAIMS ARISING FROM OR RELATED TO THESE TERMS
          OR THE SERVICES IS LIMITED. WHERE LIABILITY CANNOT BE EXCLUDED OR
          LIMITED UNDER MANDATORY LAW, THIS SECTION APPLIES ONLY TO THE EXTENT
          LEGALLY PERMITTED.
        </p>

        <h3 className="mb-3 text-lg font-medium">13.4 Assumption of Risk</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          You expressly acknowledge and agree that your use of the Services is
          at your sole risk. You assume full responsibility for all risks
          associated with your use of the Services and any products accessed
          through them.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Nothing in these Terms excludes or limits our liability for death or
          personal injury caused by our negligence, fraud or wilful misconduct,
          or for breach of such obligations as cannot lawfully be limited under
          applicable law (e.g. Swiss mandatory provisions).
        </p>

        <h3 className="mb-3 text-lg font-medium">13.5 Force Majeure</h3>
        <p className="text-muted-foreground text-sm">
          We shall not be liable for any failure or delay in performing our
          obligations where such failure or delay results from circumstances
          beyond our reasonable control, including but not limited to: acts of
          God, natural disasters, war, terrorism, riots, embargoes, acts of
          civil or military authorities, fire, floods, accidents, strikes,
          pandemic, or shortages of transportation, facilities, fuel, energy,
          labor, or materials.
        </p>
      </section>

      {/* Section 14 */}
      <section id="indemnification" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">14. Indemnification</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          You agree to defend, indemnify, and hold harmless Helvety by Rubin,
          its owner, employees, agents, and service providers from and against
          any and all claims, damages, obligations, losses, liabilities, costs,
          and expenses (including but not limited to attorney&apos;s fees)
          arising from:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
          <li>Your use of and access to the Services</li>
          <li>Your violation of any provision of these Terms</li>
          <li>
            Your violation of any third-party right, including any intellectual
            property, privacy, or proprietary right
          </li>
          <li>
            Any claim that your use of the Services caused damage to a third
            party
          </li>
          <li>Your breach of any applicable law or regulation</li>
        </ul>
      </section>

      {/* Section 15 */}
      <section id="termination" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">15. Termination</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We may terminate or suspend your account and access to the Services
          for cause, including but not limited to: breach of these Terms,
          fraudulent activity, illegal use, or prolonged inactivity. We will
          provide reasonable notice (minimum 30 days) except in cases of serious
          breach requiring immediate action.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Upon termination, your right to use the Services will immediately
          cease. All provisions of these Terms which by their nature should
          survive termination shall survive, including but not limited to:
          intellectual property provisions, warranty disclaimers, limitation of
          liability, and indemnification.
        </p>
        <p className="text-muted-foreground text-sm">
          You may terminate your account at any time by using the account
          deletion feature at{" "}
          <a
            href={`${urls.store}/account`}
            className="hover:text-foreground underline transition-colors"
          >
            helvety.com/store/account
          </a>{" "}
          or by contacting us at {CONTACT_EMAIL}. Account deletion is intended
          to be permanent and may not be reversible. We recommend exporting your
          data before proceeding.
        </p>
      </section>

      {/* Section 16 */}
      <section id="governing" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">
          16. Governing Law and Jurisdiction
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          These Terms shall be governed by and construed in accordance with the
          substantive laws of Switzerland, without regard to its conflict of law
          provisions.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          If you are a consumer residing outside Switzerland, mandatory
          protections under the laws of your country of residence may apply to
          the extent they cannot be contractually excluded.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">
            Amicable Dispute Resolution:
          </strong>{" "}
          Before initiating legal proceedings, we encourage you to contact us at{" "}
          {CONTACT_EMAIL} to attempt to resolve any dispute amicably. We will
          endeavor to respond within 14 days. Nothing in this section prevents
          either party from seeking injunctive or other equitable relief from a
          court of competent jurisdiction.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Any disputes arising out of or relating to these Terms or the Services
          shall be subject to the exclusive jurisdiction of the courts of
          Basel-Stadt, Switzerland, except where mandatory law provides
          otherwise.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Language:</strong> These Terms are
          drafted in English. In the event of any discrepancy between this
          English version and any translation, the English version shall
          prevail.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Severability:</strong> If any
          provision of these Terms is held to be invalid or unenforceable, such
          provision shall be struck and the remaining provisions shall remain in
          full force and effect.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Entire Agreement:</strong> These
          Terms, together with our Privacy Policy and any other agreements
          expressly incorporated by reference herein, constitute the entire
          agreement between you and Helvety by Rubin concerning the Services.
          These Terms supersede all prior or contemporaneous communications,
          whether electronic, oral, or written, between you and us regarding the
          Services.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">No Waiver:</strong> Our failure to
          enforce any right or provision of these Terms shall not constitute a
          waiver of such right or provision. Any waiver of any provision of
          these Terms will be effective only if in writing and signed by us.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Assignment:</strong> You may not
          assign or transfer these Terms, by operation of law or otherwise,
          without our prior written consent. Any attempt by you to assign or
          transfer these Terms without such consent will be null and void. We
          may freely assign or transfer these Terms without restriction. Subject
          to the foregoing, these Terms will bind and inure to the benefit of
          the parties, their successors, and permitted assigns.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Notices:</strong> Any notices or
          other communications provided by us under these Terms will be given:
          (i) via email to the email address associated with your account; or
          (ii) by posting to the Services. For notices made by email, the date
          of receipt will be deemed the date on which such notice is
          transmitted. You may give us notice by email to
          {CONTACT_EMAIL} or by mail to our address listed in the Contact
          section.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          <strong className="text-foreground">Export Compliance:</strong> You
          agree to comply with all applicable export and re-export control laws
          and regulations, including the Swiss State Secretariat for Economic
          Affairs (SECO) regulations, the US Export Administration Regulations
          (EAR), and sanctions programs administered by relevant authorities.
          You may not download or use the Services if you are located in a
          country or region subject to comprehensive sanctions, or if you are on
          any government list of prohibited or restricted parties.
        </p>
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Headings:</strong> The section
          headings in these Terms are for convenience only and have no legal or
          contractual effect.
        </p>
      </section>

      {/* Section 17 */}
      <section id="changes" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">17. Changes to Terms</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          We reserve the right to modify or replace these Terms at any time at
          our sole discretion. If a revision is material, we will provide at
          least 30 days&apos; notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole
          discretion.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          By continuing to access or use the Services after any revisions become
          effective, you agree to be bound by the revised Terms.
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          If you do not agree to the revised Terms, you may terminate your
          account and stop using the Services. We will not retroactively apply
          material changes to previously granted access rights where prohibited
          by applicable law.
        </p>
      </section>

      {/* Section 18 */}
      <section id="contact" className="legal-section">
        <h2 className="mb-4 text-xl font-semibold">18. Contact Information</h2>
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
          By using Helvety services, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service.
        </p>
      </LegalFooterNote>
    </LegalPageShell>
  );
}
