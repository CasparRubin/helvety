"use client";
/* eslint-disable jsdoc/require-jsdoc */

import type { UpscaleModelId } from "@/lib/models";
import type { WorkerRequest, WorkerResponse } from "@/lib/upscale-worker-types";

export interface ModelDownloadProgress {
  readonly modelId: UpscaleModelId;
  readonly received: number;
  readonly total: number | null;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (progress: ModelDownloadProgress) => void;
}

export interface UpscaleWorkerClient {
  getRuntime: () => Promise<string>;
  upscale: (options: {
    file: File;
    width: number;
    height: number;
    modelId: UpscaleModelId;
    onModelDownloadProgress?: (progress: ModelDownloadProgress) => void;
  }) => Promise<{ outputUrl: string }>;
  dispose: () => void;
}

export function createUpscaleWorkerClient(): UpscaleWorkerClient {
  const worker = new Worker(
    new URL("../workers/upscale.worker.ts", import.meta.url),
    {
      type: "module",
    }
  );
  const pending = new Map<string, PendingRequest>();

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;

    if (message.type === "model:download:progress") {
      const tracker = pending.get(message.id);
      tracker?.onProgress?.({
        modelId: message.modelId,
        received: message.received,
        total: message.total,
      });
      return;
    }

    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);

    if (message.type === "error") {
      request.reject(new Error(message.message));
      return;
    }

    if (message.type === "runtime:success") {
      request.resolve(message.runtime);
      return;
    }

    request.resolve({ outputUrl: URL.createObjectURL(message.outputBlob) });
  };

  worker.onerror = (event) => {
    pending.forEach((request) => request.reject(event.error));
    pending.clear();
  };

  function postMessage(
    payload: WorkerRequest,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      pending.set(payload.id, { resolve, reject, onProgress });
      worker.postMessage(payload);
    });
  }

  return {
    async getRuntime() {
      const id = crypto.randomUUID();
      const runtime = await postMessage({ type: "runtime", id });
      return String(runtime);
    },
    async upscale({ file, width, height, modelId, onModelDownloadProgress }) {
      const id = crypto.randomUUID();
      const response = await postMessage(
        {
          type: "upscale",
          id,
          modelId,
          file,
          width,
          height,
        },
        onModelDownloadProgress
      );
      return response as { outputUrl: string };
    },
    dispose() {
      pending.forEach((request) =>
        request.reject(new Error("Worker disposed"))
      );
      pending.clear();
      worker.terminate();
    },
  };
}
