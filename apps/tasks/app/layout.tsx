import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

/** Shared tasks SEO / social copy (single source for metadata + JSON-LD). */
export const TASKS_APP_DESCRIPTION =
  "Stage-based tasks encrypted before they leave your browser. MIT-licensed open source, built in Switzerland.";

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
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer.
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
