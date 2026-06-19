import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  UPSCALE_WORKER_OPERATION_TIMEOUT_MS,
  createUpscaleWorkerClient,
} from "./upscale-worker-client";

describe("createUpscaleWorkerClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rejects and terminates the worker when a request times out", async () => {
    const terminate = vi.fn();
    const postMessage = vi.fn();

    /** Minimal Worker stand-in for timeout behavior tests. */
    class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage = postMessage;
      terminate = terminate;
    }

    vi.stubGlobal("Worker", MockWorker);

    const client = createUpscaleWorkerClient();
    const runtimePromise = client.getRuntime();
    const assertion = expect(runtimePromise).rejects.toThrow(
      "Upscale processing timed out"
    );

    await vi.advanceTimersByTimeAsync(UPSCALE_WORKER_OPERATION_TIMEOUT_MS);
    await assertion;
    expect(terminate).toHaveBeenCalled();
  });
});
