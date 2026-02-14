import type { MetadataRoute } from "next";

/**
 * Web App Manifest for PWA support
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Helvety",
    short_name: "Helvety",
    description: "Helvety. Designed in Switzerland.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/helvety_Identifier_whiteBg.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["software", "business"],
    lang: "en-US",
    dir: "ltr",
  };
}
