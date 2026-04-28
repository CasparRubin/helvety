"use client";

import { HelvetyImageUpscaler } from "@/components/helvety-image-upscaler";

/**
 * Client component wrapper for the image upscaler app.
 * No login required.
 */
export function PageClient(): React.JSX.Element {
  return <HelvetyImageUpscaler />;
}
