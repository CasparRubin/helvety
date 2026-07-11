/**
 * Download Tesseract language data (`eng`, `deu`) into apps/ocr/public/tessdata
 * for same-origin, offline OCR. These files are large binaries and are
 * gitignored; run this once during local setup (and in CI image builds that
 * need runtime OCR). Uses the `tessdata_fast` models for smaller downloads.
 */
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const LANGUAGES = ["eng", "deu"];
const BASE_URL = "https://github.com/tesseract-ocr/tessdata_fast/raw/main";

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const destDir = path.join(process.cwd(), "public", "tessdata");
  await mkdir(destDir, { recursive: true });

  for (const lang of LANGUAGES) {
    const fileName = `${lang}.traineddata`;
    const destPath = path.join(destDir, fileName);
    if (await fileExists(destPath)) {
      console.log(`Skipping ${fileName} (already present)`);
      continue;
    }
    const url = `${BASE_URL}/${fileName}`;
    console.log(`Downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    await pipeline(
      Readable.fromWeb(response.body),
      createWriteStream(destPath)
    );
    console.log(`Saved ${fileName}`);
  }

  console.log("Tesseract language data ready.");
}

main().catch((error) => {
  console.error("Failed to download Tesseract language data:", error);
  process.exit(1);
});
