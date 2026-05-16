import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { productArtwork } from "./product-artwork";

const storePublicDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public"
);

describe("product artwork registry", () => {
  it("registers every artwork_*.webp file in public/", () => {
    const artworkFiles = readdirSync(storePublicDir)
      .filter((name) => /^artwork_\d+\.webp$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const registryKeys = Object.keys(productArtwork).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    expect(registryKeys).toHaveLength(artworkFiles.length);

    for (const file of artworkFiles) {
      const index = file.match(/^artwork_(\d+)\.webp$/)?.[1];
      expect(index, file).toBeTruthy();
      expect(productArtwork).toHaveProperty(`artwork${index}`);
    }
  });

  it("exposes a non-empty static import for each registry entry", () => {
    for (const artwork of Object.values(productArtwork)) {
      const path =
        typeof artwork === "string"
          ? artwork
          : typeof artwork === "object" && artwork !== null && "src" in artwork
            ? String((artwork as { src: string }).src)
            : "";
      expect(path.length).toBeGreaterThan(0);
    }
  });
});
