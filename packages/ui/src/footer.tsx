import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Fragment } from "react";

import type { ReactNode } from "react";

const LEGAL_BASE = urls.home;
const COPYRIGHT_GLUE = "\u00A0";

const linkClass = "hover:text-muted-foreground transition-colors";

/** Legal page links for the footer. */
const LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/impressum#abuse", label: "Abuse" },
] as const;

/**
 * Site footer: contact email, legal links, and a short cookie/storage notice.
 * Preference and similar storage are summarized inline; full disclosure lives
 * on the Privacy Policy (linked from the notice and nav).
 *
 * @param external - When true, legal links point to absolute URLs (urls.home)
 *   with target="_blank" (for apps served on sub-paths). When false, links are
 *   relative (for the main web app).
 * @param renderLink - Optional custom link renderer (e.g. Next.js Link). Receives
 *   href, className, children, and optional target/rel. If not provided, plain
 *   `<a>` tags are used.
 */
export function Footer({
  className,
  external = true,
  renderLink,
}: {
  className?: string;
  external?: boolean;
  renderLink?: (props: {
    href: string;
    className: string;
    children: ReactNode;
    target?: string;
    rel?: string;
  }) => ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  const link = (href: string, label: string) => {
    const fullHref = external ? `${LEGAL_BASE}${href}` : href;
    const extraProps = external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};

    if (renderLink) {
      return renderLink({
        href: fullHref,
        className: linkClass,
        children: label,
        ...extraProps,
      });
    }

    return (
      <a href={fullHref} className={linkClass} {...extraProps}>
        {label}
      </a>
    );
  };

  return (
    <footer
      className={cn(
        "border-border bg-surface-chrome shrink-0 border-t",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[2000px] px-4 py-5">
        <div className="text-muted-foreground flex flex-col items-center gap-1 text-center text-xs">
          <p>
            &copy; {currentYear}
            {COPYRIGHT_GLUE}
            Helvety &middot; This site uses essential cookies and similar
            storage for security and core functionality (for example theme
            preference). See {link("/privacy", "Privacy")} for storage details.
          </p>
          <nav className="text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            {LINKS.map(({ href, label }) => (
              <Fragment key={href}>
                <span aria-hidden>·</span>
                {link(href, label)}
              </Fragment>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
