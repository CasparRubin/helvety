/* eslint-disable jsdoc/require-jsdoc */

import * as ort from "onnxruntime-web";

import { getModelById } from "@/lib/models";
import { upscaleWithOnnx } from "@/lib/onnx-inference";
import { UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE } from "@/lib/upscale-export-limit-message";

import type { WorkerRequest, WorkerResponse } from "@/lib/upscale-worker-types";

let runtimeConfigured = false;

function supportsWebGpu(): boolean {
  const nav = navigator as Navigator & { gpu?: unknown };
  return typeof navigator !== "undefined" && typeof nav.gpu !== "undefined";
}

function configureOrtRuntime(): void {
  if (runtimeConfigured) return;
  // Self-host the wasm/JSEP runtime (copy-ort-runtime.mjs populates public/ort/).
  ort.env.wasm.wasmPaths = "/image-upscaler/ort/";
  // The proxy worker is for offloading ORT work *from* a main thread; we are
  // already inside a DedicatedWorker, so the proxy must stay disabled. It is
  // also incompatible with the WebGPU EP (GPU buffers are not transferable).
  ort.env.wasm.proxy = false;
  // Multi-threaded WASM needs SharedArrayBuffer, which requires
  // cross-origin-isolation (COOP+COEP). This app intentionally omits COEP, so
  // pin to single-thread to avoid noisy console warnings about the missing
  // SAB and to make startup deterministic.
  ort.env.wasm.numThreads = 1;
  // Steer WebGPU toward the discrete GPU when one is available - the default
  // ("low-power") favours integrated GPUs which are too slow for image
  // super-resolution at typical photo sizes.
  if (typeof ort.env.webgpu === "object") {
    ort.env.webgpu.powerPreference = "high-performance";
  }
  runtimeConfigured = true;
}

async function probeRuntime(): Promise<string> {
  configureOrtRuntime();
  return supportsWebGpu() ? "webgpu" : "wasm-fallback";
}

async function upscaleWithCanvas(
  file: File,
  width: number,
  height: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("2D canvas is not available in this browser.");
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    return await canvas.convertToBlob({ type: "image/png", quality: 0.95 });
  } finally {
    bitmap.close();
  }
}

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

function unreachable(value: never): never {
  throw new Error(`Unhandled worker request: ${JSON.stringify(value)}`);
}

async function handleUpscale(
  request: Extract<WorkerRequest, { type: "upscale" }>
): Promise<void> {
  const model = getModelById(request.modelId);

  let outputBlob: Blob;
  if (model.kind === "canvas") {
    outputBlob = await upscaleWithCanvas(
      request.file,
      request.width,
      request.height
    );
  } else {
    configureOrtRuntime();
    outputBlob = await upscaleWithOnnx({
      file: request.file,
      model,
      targetWidth: request.width,
      targetHeight: request.height,
      onProgress: (progress) => {
        post({
          type: "model:download:progress",
          id: request.id,
          modelId: model.id,
          received: progress.received,
          total: progress.total,
        });
      },
    });
  }

  post({ type: "upscale:success", id: request.id, outputBlob });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    switch (request.type) {
      case "runtime": {
        const runtime = await probeRuntime();
        post({ type: "runtime:success", id: request.id, runtime });
        return;
      }
      case "upscale": {
        await handleUpscale(request);
        return;
      }
      default:
        unreachable(request);
    }
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
