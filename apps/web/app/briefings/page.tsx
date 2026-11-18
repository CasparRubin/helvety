import { urls } from "@helvety/shared/config";

import { BriefingIndex } from "@/components/briefing-article";
import { BRIEFINGS } from "@/content/briefings";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Briefings",
  description:
    "Short technical reports. Each briefing says what a paper, a lab, or a release reported.",
  alternates: {
    canonical: `${urls.home}/briefings`,
  },
};

/** Index of Helvety briefings. */
export default function BriefingsPage() {
  return <BriefingIndex briefings={BRIEFINGS} />;
}
