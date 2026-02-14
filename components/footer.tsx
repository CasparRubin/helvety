import Link from "next/link";

import { cn } from "@/lib/utils";

/** Site footer: contact email, legal links, and cookie info. */
export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn("border-border bg-card/35 shrink-0 border-t", className)}
    >
      <div className="mx-auto w-full max-w-[2000px] px-4 py-3">
        <div className="text-muted-foreground flex flex-col items-center gap-1 text-center text-xs">
          <p>
            This site uses essential cookies for authentication and security.
          </p>
          <nav className="text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px]">
            <a
              href="mailto:contact@helvety.com"
              className="hover:text-muted-foreground transition-colors"
            >
              contact@helvety.com
            </a>
            <span aria-hidden>·</span>
            <Link
              href="/impressum"
              className="hover:text-muted-foreground transition-colors"
            >
              Impressum
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/privacy"
              className="hover:text-muted-foreground transition-colors"
            >
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/terms"
              className="hover:text-muted-foreground transition-colors"
            >
              Terms
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/impressum#abuse"
              className="hover:text-muted-foreground transition-colors"
            >
              Abuse
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
