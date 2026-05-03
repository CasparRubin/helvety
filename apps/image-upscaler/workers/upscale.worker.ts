/* eslint-disable jsdoc/require-jsdoc */

import * as ort from "onnxruntime-web";

import { UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE } from "@/lib/upscale-export-limit-message";

import type { WorkerRequest, WorkerResponse } from "@/lib/upscale-worker-types";

let runtimeLabel = "wasm-fallback";

function supportsWebGpu(): boolean {
  const nav = navigator as Navigator & { gpu?: unknown };
  return typeof navigator !== "undefined" && typeof nav.gpu !== "undefined";
}

async function initializeRuntime(): Promise<string> {
  if (supportsWebGpu()) {
    try {
      ort.env.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
      runtimeLabel = "webgpu-onnx-ready";
      return runtimeLabel;
    } catch {
      runtimeLabel = "wasm-fallback";
      return runtimeLabel;
    }
  }
  runtimeLabel = "wasm-fallback";
  return runtimeLabel;
}

// PNG export: createImageBitmap + OffscreenCanvas. ORT init in this module is unused for this path.
async function upscaleWithCanvas(
  file: File,
  width: number,
  height: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("2D canvas is not available in this browser.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return await canvas.convertToBlob({ type: "image/png", quality: 0.95 });
}

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === "runtime") {
      const runtime = await initializeRuntime();
      post({ type: "runtime:success", id: request.id, runtime });
      return;
    }

    const outputBlob = await upscaleWithCanvas(
      request.file,
      request.width,
      request.height
    );
    post({
      type: "upscale:success",
      id: request.id,
      outputBlob,
    });
  } catch (error) {
    let errorMessage =
      error instanceof Error ? error.message : "Unexpected worker error";
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      errorMessage = UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE;
    } else if (/invalid state/i.test(errorMessage)) {
      errorMessage = UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE;
    }
    post({
      type: "error",
      id: request.id,
      message: errorMessage,
    });
  }
};
