import { HeroSection } from "@/components/hero-section";

/** Gateway home (`/`): {@link HeroSection} with Hyperspeed (client-only; fades in after `onReady`; hides before cross-zone navigation). */
export default function Page() {
  return <HeroSection />;
}
