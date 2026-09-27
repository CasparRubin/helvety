import { HeroMarketingShell } from "@/components/hero-marketing-shell";

/**
 * Gateway home (`/`): server-rendered hero copy on a plain theme background.
 * Store catalog prerender is a `Speculation-Rules` response header, not a
 * client script (see `next.config.ts`).
 */
export default function Page() {
  return <HeroMarketingShell />;
}
