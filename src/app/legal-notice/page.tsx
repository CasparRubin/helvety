import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function LegalNotice() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full space-y-8">
        <h1 className="text-2xl font-medium mb-8">Legal Notice</h1>

        <div className="space-y-6 text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Company</p>
            <p>Helvety by Rubin</p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Owner</p>
            <p>
              <a
                href="https://casparrubin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline transition-colors inline-flex items-center gap-1"
              >
                Caspar Camille Rubin
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p>Helvety by Rubin</p>
            <p>Holeestrasse 116</p>
            <p>4054 Basel</p>
            <p>Switzerland</p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Contact</p>
            contact@helvety.com
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Trademark</p>
            <p>The Helvety brand is a registered Swiss trademark.</p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </Link>
      </div>
    </main>
  );
}

