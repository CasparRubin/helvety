import Link from "next/link";
import { ArrowLeft, FileText, Scale, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Helvety PDF",
};

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 container mx-auto overflow-hidden p-4">
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-w-0 min-h-0 relative order-last lg:order-first">
        <ScrollArea className="h-full w-full">
          <div className="prose prose-sm max-w-none dark:prose-invert p-4">
        <div className="mb-8 p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Important Notice</h2>
          <p className="mb-0">
            <strong>This is an experimental service provided &quot;AS IS&quot; with NO WARRANTIES.</strong> By using this service, you acknowledge that you use it entirely at your own risk. Helvety assumes NO LIABILITY for data loss, security breaches, service interruptions, or any other damages. You are solely responsible for your data and its backups.
          </p>
        </div>

        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 30, 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-2">
            This Privacy Policy describes how Helvety PDF (the &quot;Service&quot;) handles information in connection with your use of the Service. This Privacy Policy applies to all users of the Service.
          </p>
          <p>
            <strong>IMPORTANT:</strong> The Service is provided in an experimental and alpha stage. This Privacy Policy contains important disclaimers and limitations regarding data protection, privacy, and security. Please read this Privacy Policy carefully before using the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Data Controller</h2>
          <p className="mb-2">
            The data controller responsible for this Service is:
          </p>
          <div className="pl-4 mb-2">
            <p className="mb-1"><strong>Helvety by Rubin</strong></p>
            <p className="mb-1">Holeestrasse 116</p>
            <p className="mb-1">4054 Basel, Switzerland</p>
            <p className="mb-1">
              Email:{" "}
              <a href="mailto:contact@helvety.com" className="text-primary hover:underline">
                contact@helvety.com
              </a>
            </p>
          </div>
          <p>
            For complete company information, please refer to our{" "}
            <a href="https://helvety.com/legal-notice" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Legal Notice (Impressum)
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Client-Side Processing</h2>
          <p className="mb-2">
            <strong>All file processing happens entirely in your browser on your device.</strong> The Service is designed to operate as a client-side application, meaning:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>All PDF and image files you upload are processed locally in your browser</li>
            <li>The Helvety PDF application does not transmit or store your file data</li>
            <li>All processing occurs on your device using your device&apos;s resources</li>
          </ul>
          <p className="mb-2">
            <strong>Important:</strong> While the Helvety PDF application itself does not transmit or store your file data, please note that hosting infrastructure (Vercel) may collect connection metadata, IP addresses, request logs, and other information as described in Section 5.
          </p>
          <p>
            However, you acknowledge that even with client-side processing, there may be risks associated with using web-based applications, and Helvety makes no guarantees regarding the security, privacy, or confidentiality of your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information We Do NOT Collect</h2>
          <p className="mb-2">The Service is designed with privacy in mind. We do NOT collect, store, transmit, or analyze:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>Any PDF files or images you upload</li>
            <li>Any content, data, or information contained in your files</li>
            <li>Any personal information or personally identifiable information (PII), including but not limited to:
              <ul className="list-disc pl-6 mt-1">
                <li>Email addresses</li>
                <li>Names or usernames</li>
                <li>Contact information</li>
                <li>Registration or account data</li>
                <li>Any other personal identifiers</li>
              </ul>
            </li>
            <li>Any usage data, analytics, or tracking information</li>
            <li>Any account information (the Service does not require accounts, logins, or user registration)</li>
            <li>Any cookies or local storage data beyond minimal UI preferences (such as column layout settings)</li>
          </ul>
          <p className="mb-2">
            <strong>The Service does not require user registration, accounts, or any form of authentication.</strong> You can use the Service without providing any personal information, including email addresses, names, or any other identifying data.
          </p>
          <p>
            <strong>However, you acknowledge that this Privacy Policy makes no guarantees, representations, or warranties regarding data collection, and you use the Service entirely at your own risk.</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. NO WARRANTIES REGARDING PRIVACY OR DATA PROTECTION</h2>
          <p className="font-semibold mb-2">
            HELVETY MAKES NO WARRANTIES, REPRESENTATIONS, OR GUARANTEES REGARDING THE PRIVACY, SECURITY, CONFIDENTIALITY, OR PROTECTION OF YOUR DATA, INFORMATION, OR CONTENT.
          </p>
          <p className="mb-2">This includes, but is not limited to:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>No guarantee that your data will remain private or confidential</li>
            <li>No guarantee that your data will not be accessed, intercepted, or compromised</li>
            <li>No guarantee that the Service is free from security vulnerabilities, bugs, or flaws</li>
            <li>No guarantee that third parties (including browser vendors, hosting providers, or network operators) will not access, collect, or transmit your data</li>
            <li>No guarantee that your data will not be subject to government surveillance, data requests, or legal processes</li>
            <li>No guarantee that the Service complies with any specific privacy laws or regulations</li>
          </ul>
          <p className="font-semibold">
            YOU ACKNOWLEDGE THAT YOU USE THE SERVICE ENTIRELY AT YOUR OWN RISK AND THAT HELVETY ASSUMES NO RESPONSIBILITY OR LIABILITY FOR ANY PRIVACY BREACHES, DATA LOSS, OR SECURITY INCIDENTS.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services and Dependencies</h2>
          <p className="mb-2">
            The Service may use, integrate with, or depend on third-party services, technologies, or infrastructure, including but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Web browsers and browser APIs</li>
            <li>Hosting providers and content delivery networks (CDNs)</li>
            <li>JavaScript libraries and frameworks</li>
            <li>PDF processing libraries</li>
            <li>Other third-party services or dependencies</li>
          </ul>
          <p className="mb-2">
            Helvety makes no warranties or representations regarding third-party services and shall not be liable for any privacy breaches, data collection, or security issues arising from or related to third-party services.
          </p>
          <p className="mb-2 font-semibold">
            IMPORTANT: Hosting Infrastructure and Vercel
          </p>
          <p className="mb-2">
            This Service is hosted on Vercel&apos;s infrastructure with geolocation set to Switzerland. <strong>Helvety has no control over Vercel&apos;s operations, data collection practices, tracking mechanisms, analytics, logging, or any other activities that Vercel may perform.</strong>
          </p>
          <p className="mb-2">
            You acknowledge and understand that:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Vercel may collect, store, transmit, or analyze data in ways that are beyond Helvety&apos;s control</li>
            <li>Vercel may use tracking technologies, analytics, or monitoring tools that Helvety cannot control or disable</li>
            <li>Vercel may log access requests, IP addresses, or other connection metadata</li>
            <li>Vercel&apos;s privacy practices, terms of service, and data handling are governed by Vercel&apos;s own policies, not by Helvety</li>
            <li>Helvety cannot guarantee or take responsibility for what Vercel does with any data, metadata, or information that passes through or is stored on Vercel&apos;s infrastructure</li>
            <li>Even though file processing happens in your browser, Vercel may still collect connection metadata, IP addresses, request headers, or other information related to your use of the Service</li>
          </ul>
          <p className="font-semibold mb-2">
            HELVETY ASSUMES NO RESPONSIBILITY OR LIABILITY FOR ANY DATA COLLECTION, TRACKING, LOGGING, ANALYTICS, OR OTHER ACTIVITIES PERFORMED BY VERCEL OR ANY OTHER THIRD-PARTY HOSTING PROVIDER.
          </p>
          <p>
            You acknowledge that third-party services may collect, store, transmit, or analyze data in ways that are beyond Helvety&apos;s control, and Helvety assumes no responsibility or liability for such activities. You use this Service with the understanding that hosting infrastructure is operated by third parties over which Helvety has no control.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
          <p className="mb-2">
            While the Service is designed to process files locally in your browser, connection metadata and related data may be transferred internationally through our hosting infrastructure.
          </p>
          <p className="mb-2 font-semibold">
            Transfers to the United States:
          </p>
          <p className="mb-2">
            Vercel, Inc. is a company based in the United States. Although our Vercel deployment is configured with geolocation set to Switzerland, certain data (such as IP addresses, request logs, and connection metadata) may be processed or stored in the United States or other countries where Vercel operates infrastructure.
          </p>
          <p className="mb-2 font-semibold">
            Safeguards for International Transfers:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Vercel is certified under the EU-US Data Privacy Framework (DPF), which provides a mechanism for lawful data transfers from the EU, UK, and Switzerland to the United States</li>
            <li>Vercel utilizes EU Standard Contractual Clauses (SCCs) and the UK Addendum as additional transfer mechanisms</li>
            <li>Vercel maintains ISO 27001:2022 certification and SOC 2 Type 2 attestation</li>
          </ul>
          <p>
            For more information about Vercel&apos;s data protection practices, please refer to{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Vercel&apos;s Privacy Policy
            </a>{" "}
            and{" "}
            <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Data Processing Agreement
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Browser Storage and Local Data</h2>
          <p className="mb-2">
            The Service may use browser storage mechanisms (such as localStorage) to maintain minimal UI preferences, such as your preferred column layout setting. <strong>No personal data, emails, names, or user information is stored.</strong>
          </p>
          <p className="mb-2">
            File data is processed entirely in memory and is not persistently stored. When you close the browser tab or refresh the page, all file data is cleared from memory.
          </p>
          <p className="mb-2">
            <strong>You are solely responsible for:</strong>
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Clearing browser storage if you wish to remove any locally stored preferences</li>
            <li>Understanding that browser storage may be accessible to other applications, browser extensions, or malicious software on your device</li>
            <li>Understanding that browser storage may be subject to backup, sync, or cloud storage features provided by your browser or operating system</li>
            <li>Ensuring the security of your device and browser</li>
          </ul>
          <p>
            Helvety makes no guarantees regarding the security, privacy, or confidentiality of data stored in browser storage, and you use such storage entirely at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Experimental Nature and No Guarantees</h2>
          <p className="font-semibold mb-2">
            THE SERVICE IS PROVIDED IN AN EXPERIMENTAL AND ALPHA STAGE.
          </p>
          <p className="mb-2">
            The Service is under active development and may contain bugs, errors, security vulnerabilities, or privacy issues. Features may be incomplete, unstable, or removed without notice. The Service may not function as intended, and privacy or security features may not work correctly.
          </p>
          <p className="font-semibold">
            YOU ACKNOWLEDGE THAT THE EXPERIMENTAL NATURE OF THE SERVICE MEANS THAT PRIVACY AND SECURITY GUARANTEES CANNOT BE PROVIDED, AND YOU USE THE SERVICE ENTIRELY AT YOUR OWN RISK.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. LIMITATION OF LIABILITY</h2>
          <p className="font-semibold mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HELVETY SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING FROM OR RELATED TO:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Privacy breaches, data breaches, or unauthorized access to your data</li>
            <li>Loss, corruption, deletion, or unauthorized disclosure of your data or information</li>
            <li>Security vulnerabilities, bugs, or flaws in the Service</li>
            <li>Third-party collection, storage, transmission, or analysis of your data</li>
            <li>Government surveillance, data requests, or legal processes affecting your data</li>
            <li>Any violation of privacy laws or regulations</li>
            <li>Any other privacy or security-related incidents or issues</li>
          </ul>
          <p>
            THIS LIMITATION OF LIABILITY APPLIES REGARDLESS OF THE THEORY OF LIABILITY, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, EVEN IF HELVETY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Your Rights Under Swiss Law</h2>
          <p className="mb-2">
            Under the Swiss Federal Act on Data Protection (FADP), you have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li><strong>Right of Access:</strong> You have the right to request information about whether we process your personal data and, if so, what data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You have the right to request correction of inaccurate personal data concerning you.</li>
            <li><strong>Right to Deletion:</strong> You have the right to request deletion or destruction of your personal data under certain circumstances.</li>
            <li><strong>Right to Data Portability:</strong> You have the right to receive your personal data in a commonly used, machine-readable format.</li>
            <li><strong>Right to Object:</strong> You have the right to object to the processing of your personal data under certain circumstances.</li>
          </ul>
          <p className="mb-2">
            <strong>How to Exercise Your Rights:</strong> Since the Service does not collect, store, or process personal data (all file processing occurs locally in your browser), there is typically no personal data held by Helvety to access, rectify, or delete. However, if you believe we hold any personal data about you or wish to exercise any of these rights, please contact us at{" "}
            <a href="mailto:contact@helvety.com" className="text-primary hover:underline">
              contact@helvety.com
            </a>.
          </p>
          <p className="mb-2">
            <strong>For localStorage data:</strong> You can clear any locally stored preferences (such as column layout settings) directly through your browser settings by clearing site data for this website.
          </p>
          <p className="mb-2 font-semibold">
            Right to Lodge a Complaint:
          </p>
          <p>
            If you believe that the processing of your personal data violates the Swiss Federal Act on Data Protection, you have the right to lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC):{" "}
            <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              www.edoeb.admin.ch
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Your Responsibilities</h2>
          <p className="font-semibold mb-2">YOU ARE SOLELY RESPONSIBLE FOR YOUR USE OF THE SERVICE AND ALL RISKS ASSOCIATED THEREWITH.</p>
          <p className="mb-2">You acknowledge and agree that:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>You use the Service entirely at your own risk</li>
            <li>You are responsible for ensuring that you have the legal right to process any files you upload</li>
            <li>You are responsible for maintaining backups of all important data</li>
            <li>You are responsible for ensuring the security of your device and browser</li>
            <li>You will not use the Service for any critical or production purposes where privacy or security is essential</li>
            <li>You will not rely on the Service for any important business or personal decisions</li>
            <li>You understand that the experimental nature of the Service means that privacy or security cannot be guaranteed</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Open Source and Transparency</h2>
          <p className="mb-2">
            The Service is open source, and the source code is publicly available. You can review the source code to understand how the Service works and verify our privacy and security claims. However, you acknowledge that:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Open source does not guarantee privacy or security</li>
            <li>The Service may contain bugs, vulnerabilities, or privacy issues that have not been identified</li>
            <li>Third-party dependencies or infrastructure may not be open source or may have privacy or security issues</li>
            <li>Helvety makes no guarantees regarding the accuracy, completeness, or security of the source code</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
          <p className="mb-2">
            Helvety reserves the right to modify this Privacy Policy at any time, in its sole discretion, without prior notice. Your continued use of the Service after any such modifications constitutes your acceptance of the modified Privacy Policy.
          </p>
          <p>
            It is your responsibility to review this Privacy Policy periodically for changes. However, Helvety makes no guarantees that you will be notified of changes, and you acknowledge that you use the Service entirely at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. No Legal Advice</h2>
          <p>
            This Privacy Policy is provided for informational purposes only and does not constitute legal advice. You should consult with a qualified legal professional if you have questions about privacy laws, data protection regulations, or your rights and obligations regarding data privacy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
          <p>
            This Privacy Policy shall be governed by and construed in accordance with the laws of Switzerland, without regard to its conflict of law provisions. However, you acknowledge that privacy laws may vary by jurisdiction, and Helvety makes no guarantees regarding compliance with any specific privacy laws or regulations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
          <p className="mb-2">
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:contact@helvety.com" className="text-primary hover:underline">
              contact@helvety.com
            </a>
          </p>
          <p className="font-semibold">
            HOWEVER, WE MAKE NO GUARANTEES REGARDING OUR ABILITY OR OBLIGATION TO RESPOND TO INQUIRIES OR REQUESTS, ESPECIALLY GIVEN THE EXPERIMENTAL NATURE OF THE SERVICE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">18. Acknowledgment</h2>
          <p className="font-semibold">
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS SET FORTH IN THIS PRIVACY POLICY, INCLUDING ALL DISCLAIMERS, LIMITATIONS OF LIABILITY, AND WAIVERS OF RIGHTS.
          </p>
          <p className="mt-4">
            You acknowledge that you understand and accept all risks associated with using an experimental service, including but not limited to privacy risks, security risks, and data loss risks. You agree that Helvety assumes no responsibility or liability for any privacy breaches, data loss, security incidents, or other damages arising from or related to your use of the Service.
          </p>
        </section>

          </div>
        </ScrollArea>
      </div>

      {/* Navigation Panel - Fixed */}
      <aside className="order-first lg:order-last flex-shrink-0">
        {/* Mobile: Horizontal compact bar */}
        <div className="lg:hidden w-full bg-muted/30 border border-border/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/">
              <Button variant="outline" size="default">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/terms">
                <Button variant="ghost" size="default">
                  <FileText className="h-4 w-4 mr-2" />
                  Terms
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop: Vertical panel */}
        <div className="hidden lg:flex w-80 flex-shrink-0 flex-col gap-6 h-full max-h-full">
          <div className="bg-muted/30 border border-border/50 p-6 flex flex-col gap-6">
            {/* Navigation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Navigation</h3>
              <div className="space-y-2">
                <Link href="/" className="block">
                  <Button variant="default" className="w-full" size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to App
                  </Button>
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Legal</h3>
              <div className="space-y-2">
                <Link href="/terms" className="block">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <FileText className="h-4 w-4 mr-2" />
                    Terms of Service
                  </Button>
                </Link>
                <div className="flex items-center gap-2 p-2 rounded-md border border-primary bg-primary/10">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Privacy Policy</span>
                </div>
                <a
                  href="https://helvety.com/legal-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Building2 className="h-4 w-4 mr-2" />
                    Helvety Legal Notice
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

