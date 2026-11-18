import { urls } from "@helvety/shared/config";
import { notFound } from "next/navigation";

import { BriefingArticle } from "@/components/briefing-article";
import { BRIEFINGS, getBriefing } from "@/content/briefings";

import type { Metadata } from "next";

/** Props for one briefing route. */
interface BriefingPageProps {
  params: Promise<{ slug: string }>;
}

/** Prerender every published briefing. Unknown slugs call `notFound()`. */
export function generateStaticParams(): Array<{ slug: string }> {
  return BRIEFINGS.map((briefing) => ({ slug: briefing.slug }));
}

/** Canonical metadata for one briefing. */
export async function generateMetadata({
  params,
}: BriefingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const briefing = getBriefing(slug);
  if (!briefing) {
    return {
      title: "Briefing not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: briefing.subject,
    description: briefing.lines[0],
    alternates: {
      canonical: `${urls.home}/briefings/${briefing.slug}`,
    },
  };
}

/**
 * One briefing: the report, its sources, and thread notes when they exist.
 * Resolves the slug before rendering so unknown slugs return a real 404
 * status instead of a streamed 200 shell.
 */
export default async function BriefingPage({ params }: BriefingPageProps) {
  const { slug } = await params;
  const briefing = getBriefing(slug);
  if (!briefing) {
    notFound();
  }

  return <BriefingArticle briefing={briefing} />;
}
