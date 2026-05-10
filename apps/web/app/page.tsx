import { HeroSection } from "@/components/hero-section";
import { StoreAppsShowcase } from "@/components/store-apps-showcase";

/** Home page (`/`): hero plus Store-aligned app bands (shared card copy). */
export default function Page() {
  return (
    <>
      <HeroSection />
      <StoreAppsShowcase />
    </>
  );
}
