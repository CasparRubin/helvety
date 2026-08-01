import { urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";

const LEGAL_BASE = urls.home;
const COPYRIGHT_GLUE = "\u00A0";

const linkClass = "hover:text-muted-foreground transition-colors";

/** Legal page links for the footer. */
const LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

/**
 * Site footer: copyright and legal links as a centered middot row.
 * On narrow widths, copyright wraps alone onto the first row and the three
 * legal links stay together on the second. Browser preference storage is
 * disclosed on the Privacy Policy (nav link), not repeated inline here.
 * Contact lives in the About dialog.
 *
 * @param external - When true, legal links point to absolute URLs (urls.home)
 *   with target="_blank" (for apps served on sub-paths). When false, links are
 *   relative (for the main web app).
 */
export function Footer({
  className,
  external = true,
}: {
  className?: string;
  external?: boolean;
}) {
  const currentYear = new Date().getFullYear();

  const link = (href: string, label: string) => {
    const fullHref = external ? `${LEGAL_BASE}${href}` : href;
    const extraProps = external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};

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
      <div className="mx-auto w-full max-w-[2000px] px-4 py-3">
        <nav
          aria-label="Legal"
          className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs"
        >
          <span>
            &copy; {currentYear}
            {COPYRIGHT_GLUE}
            Helvety
          </span>
          <span className="inline-flex items-center gap-x-4">
            {LINKS.map(({ href, label }, index) => (
              <span key={href} className="inline-flex items-center gap-x-4">
                {index > 0 ? <span aria-hidden>·</span> : null}
                {link(href, label)}
              </span>
            ))}
          </span>
        </nav>
      </div>
    </footer>
  );
}
