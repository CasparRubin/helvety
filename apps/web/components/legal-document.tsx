import { Button } from "@helvety/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { ReactNode } from "react";

type WithClassName = {
  children: ReactNode;
  className?: string;
};

type LegalPageShellProps = WithClassName & {
  backHref?: string;
  backLabel?: string;
};

type LegalHeaderProps = {
  title: string;
  lastReviewed: string;
  subtitle?: ReactNode;
};

type LegalHeadingProps = WithClassName & {
  id?: string;
  title: ReactNode;
};

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

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

export function LegalHeader({ title, lastReviewed, subtitle }: LegalHeaderProps) {
  return (
    <header className="legal-header">
      <h1>{title}</h1>
      <p className="legal-meta">Last reviewed: {lastReviewed}</p>
      {subtitle ? <p className="legal-meta legal-meta-secondary">{subtitle}</p> : null}
    </header>
  );
}

export function LegalToc({ children, className }: WithClassName) {
  return <nav className={cx("legal-toc", className)}>{children}</nav>;
}

export function LegalTocGroup({ children, className }: WithClassName) {
  return <div className={cx("legal-toc-group", className)}>{children}</div>;
}

export function LegalSection({ id, title, children, className }: LegalHeadingProps) {
  return (
    <section id={id} className={cx("legal-section", className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function LegalSubsection({ id, title, children, className }: LegalHeadingProps) {
  return (
    <section id={id} className={cx("legal-subsection", className)}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function LegalParagraph({ children, className }: WithClassName) {
  return <p className={cx("legal-p", className)}>{children}</p>;
}

export function LegalList({ children, className }: WithClassName) {
  return <ul className={cx("legal-list", className)}>{children}</ul>;
}

export function LegalOrderedList({ children, className }: WithClassName) {
  return <ol className={cx("legal-ordered-list", className)}>{children}</ol>;
}

export function LegalCard({ children, className }: WithClassName) {
  return <div className={cx("legal-card", className)}>{children}</div>;
}

export function LegalTableWrap({ children, className }: WithClassName) {
  return <div className={cx("legal-table-wrap", className)}>{children}</div>;
}

export function LegalFooterNote({ children, className }: WithClassName) {
  return <footer className={cx("legal-footer", className)}>{children}</footer>;
}
