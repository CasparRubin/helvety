import { HeroMarketingShell } from "@/components/hero-marketing-shell";
import { StoreProductsSpeculation } from "@/components/store-products-speculation";

/** Gateway home (`/`): server-rendered hero copy on a plain theme background. */
export default function Page() {
  return (
    <>
      <StoreProductsSpeculation />
      <HeroMarketingShell />
    </>
  );
}
