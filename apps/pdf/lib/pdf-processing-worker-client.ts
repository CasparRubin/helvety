import { logger } from "@helvety/shared/logger";

import { TIMEOUTS } from "@/lib/constants";

import type {
  WorkerRequest,
  WorkerResponse,
} from "@/lib/pdf-processing-worker-types";

/** Worker requests that are executable and expect a normal response. */
type WorkerExecutableRequest = Exclude<WorkerRequest, { kind: "cancel" }>;

/** Pending request callbacks and timeout handle tracked by request ID. */
interface PendingRequest {
  readonly resolve: (value: WorkerResponse) => void;
  readonly reject: (error: Error) => void;
  readonly timeoutId: ReturnType<typeof setTimeout>;
}

/** Returns transferable buffers for each worker request kind. */
function getTransferables(message: WorkerRequest): Transferable[] {
  if (message.kind === "extract-page") {
    return [message.payload.sourceFile.bytes];
  }

  if (message.kind === "merge-pages") {
    return message.payload.files.map((file) => file.bytes);
  }

  return [];
}

/** Client wrapper around the PDF processing worker lifecycle and requests. */
export class PdfProcessingWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private requestCounter = 0;

  /** Lazily creates and wires worker event handlers. */
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
      logger.logUnexpectedError(
        "PDF processing worker error",
        event.error ?? event.message
      );
      this.rejectAll(new Error("PDF processing worker crashed"));
      this.terminateWorker();
    };

    return worker;
  }

  /** Returns a live worker instance, creating it on first use. */
  private ensureWorker(): Worker {
    this.worker ??= this.createWorker();
    return this.worker;
  }

  /** Generates a collision-resistant ID for request/response matching. */
  private nextRequestId(): string {
    this.requestCounter += 1;
    return `pdf-worker-${Date.now()}-${this.requestCounter}`;
  }

  /** Rejects all in-flight requests and clears pending state. */
  private rejectAll(error: Error): void {
    for (const [requestId, pendingRequest] of this.pending.entries()) {
      clearTimeout(pendingRequest.timeoutId);
      pendingRequest.reject(error);
      this.pending.delete(requestId);
    }
  }

  /** Terminates worker process and clears cached reference. */
  private terminateWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  /** Posts a request to the worker and resolves with matched response. */
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

  /** Requests cancellation for all in-flight operations. */
  cancelAll(): void {
    for (const requestId of this.pending.keys()) {
      const cancelMessage: WorkerRequest = { id: requestId, kind: "cancel" };
      this.worker?.postMessage(cancelMessage);
    }

    this.rejectAll(new Error("Processing cancelled"));
  }

  /** Cancels all work and disposes worker resources. */
  dispose(): void {
    this.cancelAll();
    this.terminateWorker();
  }
}
