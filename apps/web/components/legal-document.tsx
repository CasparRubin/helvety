import { Button } from "@helvety/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { ReactNode } from "react";

/** Base props for legal UI blocks with optional custom class. */
type WithClassName = {
  children: ReactNode;
  className?: string;
};

/** Props for legal page shell with configurable back link. */
type LegalPageShellProps = WithClassName & {
  backHref?: string;
  backLabel?: string;
};

/** Props for standardized legal document header. */
type LegalHeaderProps = {
  title: string;
  lastReviewed: string;
  subtitle?: ReactNode;
};

/** Shared heading props for major/minor legal sections. */
type LegalHeadingProps = WithClassName & {
  id?: string;
  title: ReactNode;
};

/** Concatenate optional class names without external dependency. */
function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Shared shell for legal pages with back navigation and document wrapper. */
export function LegalPageShell({
  children,
  className,
  backHref = "/",
  backLabel = "Back to Home",
}: LegalPageShellProps) {
  return (
    <section className="legal-page-section">
      <div className="legal-page-container">
        <div className="legal-page-back">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </div>
        <article className={cx("legal-doc", className)}>{children}</article>
      </div>
    </section>
  );
}

/** Canonical title block used on legal documents. */
export function LegalHeader({
  title,
  lastReviewed,
  subtitle,
}: LegalHeaderProps) {
  return (
    <header className="legal-header">
      <h1>{title}</h1>
      <p className="legal-meta">Last reviewed: {lastReviewed}</p>
      {subtitle ? (
        <p className="legal-meta legal-meta-secondary">{subtitle}</p>
      ) : null}
    </header>
  );
}

/** Container for a legal table of contents block. */
export function LegalToc({ children, className }: WithClassName) {
  return <nav className={cx("legal-toc", className)}>{children}</nav>;
}

/** Optional grouping helper inside table of contents. */
export function LegalTocGroup({ children, className }: WithClassName) {
  return <div className={cx("legal-toc-group", className)}>{children}</div>;
}

/** Major section block for numbered legal headings. */
export function LegalSection({
  id,
  title,
  children,
  className,
}: LegalHeadingProps) {
  return (
    <section id={id} className={cx("legal-section", className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** Minor subsection block for nested legal headings. */
export function LegalSubsection({
  id,
  title,
  children,
  className,
}: LegalHeadingProps) {
  return (
    <section id={id} className={cx("legal-subsection", className)}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

/** Paragraph primitive for legal copy. */
export function LegalParagraph({ children, className }: WithClassName) {
  return <p className={cx("legal-p", className)}>{children}</p>;
}

/** Unordered list primitive for legal copy. */
export function LegalList({ children, className }: WithClassName) {
  return <ul className={cx("legal-list", className)}>{children}</ul>;
}

/** Ordered list primitive for legal copy. */
export function LegalOrderedList({ children, className }: WithClassName) {
  return <ol className={cx("legal-ordered-list", className)}>{children}</ol>;
}

/** Card container used for highlighted legal content blocks. */
export function LegalCard({ children, className }: WithClassName) {
  return <div className={cx("legal-card", className)}>{children}</div>;
}

/** Wrapper for responsive legal tables on small screens. */
export function LegalTableWrap({ children, className }: WithClassName) {
  return <div className={cx("legal-table-wrap", className)}>{children}</div>;
}

/** Footer note container for final legal acknowledgements. */
export function LegalFooterNote({ children, className }: WithClassName) {
  return <footer className={cx("legal-footer", className)}>{children}</footer>;
}
