import Link from "next/link";
import { ArrowLeft, FileText, Scale, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Helvety PDF",
};

export default function TermsPage(): React.JSX.Element {
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

        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 30, 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Helvety PDF (the &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use the Service. Your use of the Service constitutes your acceptance of these Terms and your acknowledgment that you understand and accept all risks associated with using an experimental service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Experimental and Alpha Status</h2>
          <p className="font-semibold mb-2">THE SERVICE IS PROVIDED IN AN EXPERIMENTAL AND ALPHA STAGE.</p>
          <p className="mb-2">
            The Service is under active development. The Service may contain bugs, errors, security vulnerabilities, and may not function as intended. Features may be incomplete, unstable, or removed without notice. The Service is provided for testing and evaluation purposes only.
          </p>
          <p className="font-semibold">YOU ACKNOWLEDGE THAT THE SERVICE IS EXPERIMENTAL AND THAT YOU USE IT ENTIRELY AT YOUR OWN RISK.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. NO WARRANTY</h2>
          <p className="font-semibold mb-2">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
          </p>
          <p className="mb-2">
            Helvety and its affiliates, officers, directors, employees, agents, and licensors (collectively, &quot;Helvety&quot;) hereby disclaim all warranties, including but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
            <li>Warranties that the Service will be uninterrupted, secure, error-free, or free from viruses or harmful components</li>
            <li>Warranties regarding the accuracy, reliability, or completeness of any content or information provided through the Service</li>
            <li>Warranties that defects will be corrected or that the Service will meet your requirements</li>
            <li>Any warranties arising from course of dealing, usage, or trade practice</li>
          </ul>
          <p className="font-semibold">
            NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED FROM HELVETY OR THROUGH THE SERVICE WILL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. LIMITATION OF LIABILITY</h2>
          <p className="font-semibold mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HELVETY SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Loss of data, information, or content</li>
            <li>Loss of profits, revenue, business opportunities, or goodwill</li>
            <li>Cost of procurement of substitute services</li>
            <li>Security breaches, unauthorized access, or data theft</li>
            <li>Service interruptions, downtime, or unavailability</li>
            <li>Errors, bugs, malfunctions, or failures of the Service</li>
            <li>Corruption, deletion, or loss of user data or content</li>
            <li>Any damages resulting from the use or inability to use the Service</li>
            <li>Any damages resulting from reliance on the Service or any information provided through it</li>
            <li>Any damages resulting from third-party services, integrations, or dependencies</li>
          </ul>
          <p className="mb-2">
            THIS LIMITATION OF LIABILITY APPLIES REGARDLESS OF THE THEORY OF LIABILITY, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, EVEN IF HELVETY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p>
            In jurisdictions that do not allow the exclusion or limitation of liability for consequential or incidental damages, Helvety&apos;s liability shall be limited to the maximum extent permitted by law. In no event shall Helvety&apos;s total liability exceed zero Swiss Francs (CHF 0.00).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. User Responsibility and Assumption of Risk</h2>
          <p className="font-semibold mb-2">YOU ARE SOLELY RESPONSIBLE FOR YOUR USE OF THE SERVICE AND ALL RISKS ASSOCIATED THEREWITH.</p>
          <p className="mb-2">You acknowledge and agree that:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>You use the Service entirely at your own risk</li>
            <li>You are responsible for maintaining backups of all data and content you upload or create using the Service</li>
            <li>You are responsible for ensuring the security of your device and browser</li>
            <li>You are responsible for all activities that occur through your use of the Service</li>
            <li>You will not hold Helvety responsible for any loss, damage, or harm resulting from your use of the Service</li>
            <li>You understand that the experimental nature of the Service means that data may be lost, corrupted, or inaccessible at any time without notice</li>
            <li>You will not use the Service for any critical or production purposes</li>
            <li>You will not rely on the Service for any important business or personal decisions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Responsibility</h2>
          <p className="font-semibold mb-2">
            YOU ARE SOLELY RESPONSIBLE FOR ALL DATA, CONTENT, AND INFORMATION THAT YOU UPLOAD, CREATE, STORE, OR TRANSMIT THROUGH THE SERVICE.
          </p>
          <p className="mb-2">
            <strong>Important:</strong> The Service does not store, collect, or retain any personal data such as email addresses, names, or user registration information. All file processing occurs locally in your browser. The Helvety PDF application does not transmit or store your file data. However, hosting infrastructure may collect connection metadata as described in Section 10.
          </p>
          <p className="mb-2">Helvety makes no guarantees, representations, or warranties regarding:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>The security, integrity, or confidentiality of your data</li>
            <li>The availability, accessibility, or recoverability of your data</li>
            <li>The accuracy, completeness, or reliability of data stored in or processed by the Service</li>
            <li>Backup, recovery, or data retention capabilities</li>
            <li>Protection against data loss, corruption, unauthorized access, or security breaches</li>
          </ul>
          <p className="font-semibold">
            HELVETY SHALL NOT BE LIABLE FOR ANY LOSS, CORRUPTION, DELETION, UNAUTHORIZED ACCESS, OR SECURITY BREACH OF YOUR DATA, REGARDLESS OF THE CAUSE.
          </p>
          <p>You are strongly advised to maintain independent backups of all important data and not to rely on the Service as your sole means of data storage.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Service Availability and Continuity</h2>
          <p className="mb-2">Helvety makes no guarantees, representations, or warranties regarding:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>The availability, uptime, or accessibility of the Service</li>
            <li>The continuity or uninterrupted operation of the Service</li>
            <li>The performance, speed, or reliability of the Service</li>
            <li>The maintenance, support, or updates to the Service</li>
          </ul>
          <p>
            The Service may be unavailable, interrupted, or discontinued at any time without notice. Helvety reserves the right to modify, suspend, or discontinue the Service, or any part thereof, at any time, for any reason, without prior notice or liability to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Modifications to Terms and Service</h2>
          <p className="mb-2">
            Helvety reserves the right to modify these Terms at any time, in its sole discretion, without prior notice. Your continued use of the Service after any such modifications constitutes your acceptance of the modified Terms. It is your responsibility to review these Terms periodically for changes.
          </p>
          <p>
            Helvety reserves the right to modify, update, or discontinue any feature, functionality, or aspect of the Service at any time, without notice or liability. Helvety may also impose limits on certain features or restrict your access to parts or all of the Service without notice or liability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Prohibited Activities and Security</h2>
          <p className="font-semibold mb-2">
            YOU ARE STRICTLY PROHIBITED FROM EXPLOITING, HACKING, ATTACKING, OR ATTEMPTING TO COMPROMISE THE SECURITY, INTEGRITY, OR AVAILABILITY OF THE SERVICE.
          </p>
          <p className="mb-2">This includes, but is not limited to:</p>
          <ul className="list-disc pl-6 mb-2">
            <li>Attempting to gain unauthorized access to the Service or data</li>
            <li>Attempting to breach, circumvent, or disable any security measures or authentication mechanisms</li>
            <li>Introducing viruses, malware, or any malicious code</li>
            <li>Performing denial-of-service attacks, distributed denial-of-service attacks, or any activity that disrupts or interferes with the Service</li>
            <li>Reverse engineering, decompiling, or disassembling any part of the Service</li>
            <li>Scanning, probing, or testing the Service for vulnerabilities without explicit written authorization</li>
            <li>Exploiting any bugs, vulnerabilities, or security flaws for malicious purposes</li>
            <li>Any other activity that compromises the security, integrity, or availability of the Service</li>
          </ul>
          <p className="font-semibold mb-2">RESPONSIBLE DISCLOSURE OF VULNERABILITIES:</p>
          <p className="mb-2">
            If you discover any security vulnerability, bug, or security flaw in the Service, you <strong>MUST</strong> immediately report it to Helvety at contact@helvety.com with the subject line &quot;Security Vulnerability Report&quot;. You agree to:
          </p>
          <ul className="list-disc pl-6 mb-2">
            <li>Provide detailed information about the vulnerability, including steps to reproduce it</li>
            <li>Keep the vulnerability confidential and not disclose it to any third party until Helvety has had a reasonable opportunity to address it</li>
            <li>Not exploit the vulnerability for any purpose, including but not limited to accessing unauthorized data, disrupting the Service, or causing harm to other users</li>
            <li>Allow Helvety a reasonable time to address the vulnerability before any public disclosure</li>
          </ul>
          <p className="font-semibold mb-2">
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT RESPONSIBLE DISCLOSURE OF VULNERABILITIES IS A FUNDAMENTAL REQUIREMENT FOR USING THIS SERVICE.
          </p>
          <p className="mb-2">
            This requirement helps developers create a safer and more secure application for all users. Failure to comply with this requirement constitutes a material breach of these Terms and may result in immediate termination of your access to the Service, legal action, and reporting to relevant authorities.
          </p>
          <p className="font-semibold">
            HELVETY RESERVES THE RIGHT TO PURSUE ALL AVAILABLE LEGAL REMEDIES AGAINST ANY USER WHO VIOLATES THIS SECTION, INCLUDING BUT NOT LIMITED TO CIVIL AND CRIMINAL PROSECUTION.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
          <p className="mb-2">
            The Service may use, integrate with, or depend on third-party services, technologies, or libraries, including but not limited to hosting providers, content delivery networks (CDNs), JavaScript libraries, PDF processing libraries, and other service providers. Helvety makes no warranties or representations regarding third-party services and shall not be liable for any issues, failures, or problems arising from or related to third-party services, including but not limited to data breaches, service interruptions, or changes to third-party service terms.
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
          </ul>
          <p className="font-semibold">
            HELVETY ASSUMES NO RESPONSIBILITY OR LIABILITY FOR ANY DATA COLLECTION, TRACKING, LOGGING, ANALYTICS, OR OTHER ACTIVITIES PERFORMED BY VERCEL OR ANY OTHER THIRD-PARTY HOSTING PROVIDER. You use this Service with the understanding that hosting infrastructure is operated by third parties over which Helvety has no control.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Helvety and its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from or related to:
          </p>
          <ul className="list-disc pl-6">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Any content, data, or information you submit, post, or transmit through the Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Governing Law and Jurisdiction</h2>
          <p className="mb-2">
            These Terms shall be governed by and construed in accordance with the laws of Switzerland, including but not limited to the Swiss Code of Obligations (OR), without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the competent courts of Switzerland.
          </p>
          <p className="mb-2">
            Notwithstanding the foregoing, if you are a consumer residing in the European Union or the United States, you may benefit from mandatory consumer protection provisions of the law of your country of residence. Nothing in these Terms affects your rights as a consumer to rely on such mandatory provisions of local law. However, to the maximum extent permitted by applicable law, you acknowledge and agree that by using this experimental Service, you waive any such consumer protection rights that may conflict with these Terms.
          </p>
          <p className="mb-2 font-semibold">FOR USERS IN THE UNITED STATES:</p>
          <p className="mb-2">
            These Terms are subject to applicable federal and state laws, including but not limited to consumer protection laws. However, to the maximum extent permitted by law, you acknowledge that the experimental nature of the Service and the comprehensive disclaimers contained herein may limit or exclude certain consumer protection rights that would otherwise apply. If you are a resident of California, you waive California Civil Code Section 1542, which states: &quot;A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party.&quot;
          </p>
          <p className="font-semibold">FOR USERS IN THE EUROPEAN UNION:</p>
          <p>
            If you are a consumer in the European Union, you may have rights under EU legislation, including but not limited to the General Data Protection Regulation (GDPR, Regulation 2016/679) and Directive 2011/83/EU on consumer rights. However, you acknowledge that the experimental nature of the Service and the comprehensive disclaimers contained herein may limit or exclude certain consumer protection rights. Nothing in these Terms affects your statutory rights as a consumer to the extent such rights cannot be excluded by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect, and the invalid, illegal, or unenforceable provision shall be modified to the minimum extent necessary to make it valid, legal, and enforceable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Entire Agreement</h2>
          <p>
            These Terms constitute the entire agreement between you and Helvety regarding the Service and supersede all prior or contemporaneous communications, proposals, and agreements, whether oral or written, relating to the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. Class Action and Jury Trial Waiver</h2>
          <p className="font-semibold mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
          </p>
          <p className="mb-2">You waive any right to participate in a class action lawsuit or class-wide arbitration against Helvety.</p>
          <p className="font-semibold mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, YOU WAIVE YOUR RIGHT TO A JURY TRIAL
          </p>
          <p>
            in any action or proceeding arising out of or relating to these Terms or the Service.
          </p>
          <p>
            These waivers may not be enforceable in all jurisdictions. In jurisdictions where such waivers are not permitted, the dispute resolution provisions shall be interpreted to provide the maximum protection to Helvety as permitted by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">16. Force Majeure</h2>
          <p className="mb-2">
            Helvety shall not be liable for any failure or delay in performance under these Terms which is due to causes beyond its reasonable control, including but not limited to: acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, network infrastructure failures, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
          </p>
          <p>
            However, you acknowledge that even in the absence of force majeure events, Helvety makes no guarantees regarding service availability or performance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">17. Waiver of Rights</h2>
          <p>
            No failure or delay by Helvety in exercising any right, power, or privilege under these Terms shall operate as a waiver thereof, nor shall any single or partial exercise of any right, power, or privilege preclude any other or further exercise thereof or the exercise of any other right, power, or privilege.
          </p>
          <p className="font-semibold mt-4">
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS SET FORTH HEREIN, INCLUDING ALL DISCLAIMERS, LIMITATIONS OF LIABILITY, AND WAIVERS OF RIGHTS.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">18. Contact Information</h2>
          <p className="mb-2">
            If you have any questions about these Terms, please contact us at:{" "}
            <a href="mailto:contact@helvety.com" className="text-primary hover:underline">
              contact@helvety.com
            </a>
          </p>
          <p className="font-semibold">
            HOWEVER, WE MAKE NO GUARANTEES REGARDING OUR ABILITY OR OBLIGATION TO RESPOND TO INQUIRIES OR REQUESTS, ESPECIALLY GIVEN THE EXPERIMENTAL NATURE OF THE SERVICE.
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
              <Link href="/privacy">
                <Button variant="ghost" size="default">
                  <Scale className="h-4 w-4 mr-2" />
                  Privacy
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
                <div className="flex items-center gap-2 p-2 rounded-md border border-primary bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Terms of Service</span>
                </div>
                <Link href="/privacy" className="block">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Scale className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                </Link>
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

