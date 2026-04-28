"use client";
/* eslint-disable jsdoc/require-jsdoc */

import type { WorkerRequest, WorkerResponse } from "@/lib/upscale-worker-types";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export function createUpscaleWorkerClient(): {
  getRuntime: () => Promise<string>;
  upscale: (options: {
    file: File;
    width: number;
    height: number;
  }) => Promise<{ outputUrl: string }>;
  dispose: () => void;
} {
  const worker = new Worker(
    new URL("../workers/upscale.worker.ts", import.meta.url),
    {
      type: "module",
    }
  );
  const pending = new Map<string, PendingRequest>();

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;
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

  function postMessage(payload: WorkerRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      pending.set(payload.id, { resolve, reject });
      worker.postMessage(payload);
    });
  }

  return {
    async getRuntime() {
      const id = crypto.randomUUID();
      const runtime = await postMessage({ type: "runtime", id });
      return String(runtime);
    },
    async upscale({ file, width, height }) {
      const id = crypto.randomUUID();
      const response = await postMessage({
        type: "upscale",
        id,
        file,
        width,
        height,
      });
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
