/* eslint-disable jsdoc/require-jsdoc */

import { logger } from "@helvety/shared/logger";

import { TIMEOUTS } from "@/lib/constants";

import type {
  WorkerRequest,
  WorkerResponse,
} from "@/lib/pdf-processing-worker-types";

type WorkerExecutableRequest = Exclude<WorkerRequest, { kind: "cancel" }>;

interface PendingRequest {
  readonly resolve: (value: WorkerResponse) => void;
  readonly reject: (error: Error) => void;
  readonly timeoutId: ReturnType<typeof setTimeout>;
}

function getTransferables(message: WorkerRequest): Transferable[] {
  if (message.kind === "extract-page") {
    return [message.payload.sourceFile.bytes];
  }

  if (message.kind === "merge-pages") {
    return message.payload.files.map((file) => file.bytes);
  }

  return [];
}

export class PdfProcessingWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private requestCounter = 0;

  private createWorker(): Worker {
    const worker = new Worker(
      new URL("../workers/pdf-processing.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const pendingRequest = this.pending.get(response.id);
      if (!pendingRequest) {
        return;
      }

      clearTimeout(pendingRequest.timeoutId);
      this.pending.delete(response.id);
      pendingRequest.resolve(response);
    };

    worker.onerror = (event: ErrorEvent) => {
      logger.error(
        "PDF processing worker error:",
        event.error ?? event.message
      );
      this.rejectAll(new Error("PDF processing worker crashed"));
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
    return `pdf-worker-${Date.now()}-${this.requestCounter}`;
  }

  private rejectAll(error: Error): void {
    for (const [requestId, pendingRequest] of this.pending.entries()) {
      clearTimeout(pendingRequest.timeoutId);
      pendingRequest.reject(error);
      this.pending.delete(requestId);
    }
  }

  private terminateWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  async postMessage(
    message: Omit<WorkerExecutableRequest, "id">
  ): Promise<WorkerResponse> {
    const worker = this.ensureWorker();
    const id = this.nextRequestId();
    const request = {
      ...message,
      id,
    } as WorkerExecutableRequest;

    return new Promise<WorkerResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Worker processing timed out"));
      }, TIMEOUTS.OPERATION_TIMEOUT);

      this.pending.set(id, { resolve, reject, timeoutId });

      try {
        worker.postMessage(request, getTransferables(request));
      } catch (error) {
        clearTimeout(timeoutId);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  cancelAll(): void {
    for (const requestId of this.pending.keys()) {
      const cancelMessage: WorkerRequest = { id: requestId, kind: "cancel" };
      this.worker?.postMessage(cancelMessage);
    }

    this.rejectAll(new Error("Processing cancelled"));
  }

  dispose(): void {
    this.cancelAll();
    this.terminateWorker();
  }
}
