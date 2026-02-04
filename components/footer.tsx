import Link from "next/link";

import { cn } from "@/lib/utils";

/** Sticky site footer: contact email + Impressum, Privacy, Terms (internal links). */
export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-border shrink-0 border-t", className)}>
      <div className="mx-auto w-full max-w-[2000px] px-4 py-3">
        <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-center text-xs">
          <a
            href="mailto:contact@helvety.com"
            className="hover:text-foreground transition-colors"
          >
            contact@helvety.com
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href="/impressum"
              className="hover:text-foreground transition-colors"
            >
              Impressum
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
