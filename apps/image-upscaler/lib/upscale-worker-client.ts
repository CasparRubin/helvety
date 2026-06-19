"use client";

import type { UpscaleModelId } from "@/lib/models";
import type { WorkerRequest, WorkerResponse } from "@/lib/upscale-worker-types";

/** Wall-clock timeout for a single worker request (upscale can be slow on large images). */
export const UPSCALE_WORKER_OPERATION_TIMEOUT_MS = 180_000;

export interface ModelDownloadProgress {
  readonly modelId: UpscaleModelId;
  readonly received: number;
  readonly total: number | null;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (progress: ModelDownloadProgress) => void;
  timeoutId: ReturnType<typeof setTimeout>;
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

/** Client wrapper around the upscale worker lifecycle, timeouts, and recovery. */
class UpscaleWorkerClientImpl implements UpscaleWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private requestCounter = 0;

  private createWorker(): Worker {
    const worker = new Worker(
      new URL("../workers/upscale.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "model:download:progress") {
        const tracker = this.pending.get(message.id);
        tracker?.onProgress?.({
          modelId: message.modelId,
          received: message.received,
          total: message.total,
        });
        return;
      }

      const request = this.pending.get(message.id);
      if (!request) return;
      this.clearPendingRequest(message.id, request);

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
      this.rejectAll(event.error ?? new Error("Upscale worker crashed"));
      this.terminateWorker();
    };

    return worker;
  }

  private ensureWorker(): Worker {
    this.worker ??= this.createWorker();
    return this.worker;
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `upscale-worker-${Date.now()}-${this.requestCounter}`;
  }

  private clearPendingRequest(id: string, request: PendingRequest): void {
    clearTimeout(request.timeoutId);
    this.pending.delete(id);
  }

  private rejectAll(error: unknown): void {
    for (const [id, request] of this.pending.entries()) {
      this.clearPendingRequest(id, request);
      request.reject(error);
    }
  }

  private terminateWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  private postMessage(
    payload: WorkerRequest,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<unknown> {
    const worker = this.ensureWorker();
    const id = payload.id;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const request = this.pending.get(id);
        if (request) {
          this.clearPendingRequest(id, request);
          request.reject(new Error("Upscale processing timed out"));
        }
        this.terminateWorker();
      }, UPSCALE_WORKER_OPERATION_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, onProgress, timeoutId });

      try {
        worker.postMessage(payload);
      } catch (error) {
        const request = this.pending.get(id);
        if (request) {
          this.clearPendingRequest(id, request);
        }
        reject(error);
      }
    });
  }

  async getRuntime(): Promise<string> {
    const id = this.nextRequestId();
    const runtime = await this.postMessage({ type: "runtime", id });
    return String(runtime);
  }

  async upscale({
    file,
    width,
    height,
    modelId,
    onModelDownloadProgress,
  }: {
    file: File;
    width: number;
    height: number;
    modelId: UpscaleModelId;
    onModelDownloadProgress?: (progress: ModelDownloadProgress) => void;
  }): Promise<{ outputUrl: string }> {
    const id = this.nextRequestId();
    const response = await this.postMessage(
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
  }

  dispose(): void {
    this.rejectAll(new Error("Worker disposed"));
    this.terminateWorker();
  }
}

export function createUpscaleWorkerClient(): UpscaleWorkerClient {
  return new UpscaleWorkerClientImpl();
}
