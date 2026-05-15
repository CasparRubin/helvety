import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { TASKS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

export { TASKS_APP_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.tasks,
  title: {
    default: "Helvety Tasks | Encrypted stage-based tasks",
    template: "%s | Helvety Tasks",
  },
  description: TASKS_APP_DESCRIPTION,
  keywords: [
    "Helvety Tasks",
    "task management",
    "todo",
    "tasks",
    "privacy",
    "secure",
    "encrypted",
  ],
  siteName: "Helvety Tasks",
  canonicalUrl: urls.tasks,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Tasks",
    twitterAlt: "Helvety Tasks",
  },
  manifest: "/tasks/manifest.json",
  category: "productivity",
  indexing: "none",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main (pages own scroll via CommandBarPageLayout), fixed footer.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <E2eeAppRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      softwareApplication={{
        name: "Helvety Tasks",
        url: urls.tasks,
        description: TASKS_APP_DESCRIPTION,
        applicationCategory: "BusinessApplication",
      }}
      encryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
