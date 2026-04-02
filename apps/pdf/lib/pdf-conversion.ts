/**
 * PDF conversion utilities for converting images to PDF documents.
 * Extracted from pdf-utils.ts for better code organization.
 */

// External libraries
import { PDFDocument } from "pdf-lib";

// Internal utilities
import { safeRevokeObjectURL } from "./blob-url-utils";
import { ERROR_TEMPLATES } from "./error-formatting";

/**
 * Represents an embedded image with its dimensions.
 */
interface ImageEmbed {
  readonly embed:
    | Awaited<ReturnType<typeof PDFDocument.prototype.embedPng>>
    | Awaited<ReturnType<typeof PDFDocument.prototype.embedJpg>>;
  readonly width: number;
  readonly height: number;
}

export interface ImageConversionOptions {
  /**
   * Enables GPU-assisted preprocessing when supported.
   */
  readonly preferGpuPreprocess?: boolean;
}

/**
 * Image blob source and MIME information.
 */
interface ImageSource {
  readonly blob: Blob;
  readonly mimeType: string;
}

/**
 * Creates an image source object from file bytes.
 */
async function createImageSourceFromArrayBuffer(
  arrayBuffer: ArrayBuffer,
  mimeType: string
): Promise<ImageSource> {
  return {
    blob: new Blob([arrayBuffer], { type: mimeType || "image/png" }),
    mimeType: mimeType || "image/png",
  };
}

/**
 * Converts a generic image source to PNG bytes via DOM canvas.
 */
async function convertImageSourceToPngBufferWithDom(
  source: ImageSource
): Promise<ArrayBuffer> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("DOM image conversion is not available");
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(source.blob);

    image.onload = () => {
      safeRevokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      safeRevokeObjectURL(url);
      reject(
        new Error(
          ERROR_TEMPLATES.ACTION_FAILED(
            "Load image",
            "Image source could not be loaded"
          )
        )
      );
    };
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      ERROR_TEMPLATES.ACTION_FAILED(
        "Get canvas context",
        "Canvas context is not available"
      )
    );
  }
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result: Blob | null) => {
      if (result) {
        resolve(result);
      } else {
        reject(
          new Error(
            ERROR_TEMPLATES.ACTION_FAILED(
              "Convert image to blob",
              "Canvas conversion failed"
            )
          )
        );
      }
    }, "image/png");
  });

  return blob.arrayBuffer();
}

/**
 * Converts a generic image source to PNG bytes via OffscreenCanvas.
 */
async function convertImageSourceToPngBufferWithOffscreenCanvas(
  source: ImageSource,
  preferGpuPreprocess: boolean
): Promise<ArrayBuffer> {
  if (
    typeof OffscreenCanvas === "undefined" ||
    typeof createImageBitmap === "undefined"
  ) {
    throw new Error("OffscreenCanvas conversion is not available");
  }

  const bitmap = await createImageBitmap(source.blob);

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    let hasGpuContext = false;

    if (preferGpuPreprocess) {
      const webgl2 = canvas.getContext("webgl2");
      const webgl = webgl2 ?? canvas.getContext("webgl");
      hasGpuContext = Boolean(webgl);
    }

    const context2d = canvas.getContext("2d");
    if (!context2d) {
      throw new Error("2D context is not available for OffscreenCanvas");
    }
    context2d.drawImage(bitmap, 0, 0);

    const blob = await canvas.convertToBlob({ type: "image/png" });
    if (preferGpuPreprocess && !hasGpuContext) {
      throw new Error("GPU context unavailable, using CPU fallback path");
    }

    return blob.arrayBuffer();
  } finally {
    bitmap.close();
  }
}

/**
 * Converts an image file to a single-page PDF document.
 * Supports PNG, JPEG, and other formats (via Canvas conversion if needed).
 *
 * @param file - The image file to convert
 * @returns A promise that resolves to a PDFDocument containing the image as a single page
 * @throws Error if the image cannot be loaded or converted
 *
 * @example
 * ```typescript
 * const pdf = await convertImageToPdf(imageFile)
 * // PDF now contains the image as a single page
 * ```
 */
export async function convertImageToPdf(
  file: File,
  options: ImageConversionOptions = {}
): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.create();
  const { preferGpuPreprocess = false } = options;

  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  let imageEmbed: ImageEmbed | null = null;

  try {
    if (mimeType === "image/png" || fileName.endsWith(".png")) {
      const pngImage = await pdf.embedPng(arrayBuffer);
      imageEmbed = {
        embed: pngImage,
        width: pngImage.width,
        height: pngImage.height,
      };
    } else if (
      mimeType === "image/jpeg" ||
      mimeType === "image/jpg" ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg")
    ) {
      const jpgImage = await pdf.embedJpg(arrayBuffer);
      imageEmbed = {
        embed: jpgImage,
        width: jpgImage.width,
        height: jpgImage.height,
      };
    } else {
      const source = await createImageSourceFromArrayBuffer(
        arrayBuffer,
        file.type || "image/png"
      );

      let pngBuffer: ArrayBuffer;
      try {
        pngBuffer = await convertImageSourceToPngBufferWithOffscreenCanvas(
          source,
          preferGpuPreprocess
        );
      } catch {
        pngBuffer = await convertImageSourceToPngBufferWithDom(source);
      }

      const pngImage = await pdf.embedPng(pngBuffer);
      imageEmbed = {
        embed: pngImage,
        width: pngImage.width,
        height: pngImage.height,
      };
    }

    if (!imageEmbed) {
      throw new Error(
        ERROR_TEMPLATES.ACTION_FAILED(
          "Embed image",
          "Image embedding failed: imageEmbed is null"
        )
      );
    }

    const page = pdf.addPage([imageEmbed.width, imageEmbed.height]);
    page.drawImage(imageEmbed.embed, {
      x: 0,
      y: 0,
      width: imageEmbed.width,
      height: imageEmbed.height,
    });

    return pdf;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      ERROR_TEMPLATES.ACTION_FAILED("Convert image to PDF", errorMessage)
    );
  }
}
