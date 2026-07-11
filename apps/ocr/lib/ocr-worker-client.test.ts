import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OCR_WORKER_OPERATION_TIMEOUT_MS } from "./constants";

const mocks = vi.hoisted(() => ({
  createWorker: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
}));

vi.mock("tesseract.js", () => ({
  createWorker: mocks.createWorker,
}));

/** Imports a fresh client instance after module mocks are registered. */
async function importClient() {
  const clientModule = await import("./ocr-worker-client");
  return clientModule.createOcrWorkerClient();
}

describe("ocr-worker-client", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createWorker.mockReset();
    mocks.recognize.mockReset();
    mocks.terminate.mockReset();
    mocks.terminate.mockResolvedValue(undefined);
    mocks.createWorker.mockResolvedValue({
      recognize: mocks.recognize,
      terminate: mocks.terminate,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns recognized text", async () => {
    mocks.recognize.mockResolvedValue({ data: { text: "hello world" } });
    const client = await importClient();

    const text = await client.recognize(new Blob(["x"]), { language: "eng" });

    expect(text).toBe("hello world");
    expect(mocks.createWorker).toHaveBeenCalledTimes(1);
  });

  it("reuses the worker for the same language and recreates it on change", async () => {
    mocks.recognize.mockResolvedValue({ data: { text: "t" } });
    const client = await importClient();

    await client.recognize(new Blob(["x"]), { language: "eng" });
    await client.recognize(new Blob(["x"]), { language: "eng" });
    expect(mocks.createWorker).toHaveBeenCalledTimes(1);

    await client.recognize(new Blob(["x"]), { language: "deu" });
    expect(mocks.createWorker).toHaveBeenCalledTimes(2);
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = await importClient();

    await expect(
      client.recognize(new Blob(["x"]), {
        language: "eng",
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(mocks.createWorker).not.toHaveBeenCalled();
  });

  it("terminates the worker and rejects when recognition times out", async () => {
    vi.useFakeTimers();
    mocks.recognize.mockReturnValue(new Promise<never>(() => {}));
    const client = await importClient();

    const pending = client.recognize(new Blob(["x"]), { language: "eng" });
    const assertion = expect(pending).rejects.toThrow("timed out");

    await vi.advanceTimersByTimeAsync(OCR_WORKER_OPERATION_TIMEOUT_MS);
    await assertion;
    expect(mocks.terminate).toHaveBeenCalled();
  });

  it("aborts an in-flight recognition when the signal fires", async () => {
    mocks.recognize.mockReturnValue(new Promise<never>(() => {}));
    const controller = new AbortController();
    const client = await importClient();

    const pending = client.recognize(new Blob(["x"]), {
      language: "eng",
      signal: controller.signal,
    });
    const assertion = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    // Let the async worker init resolve so the abort listener is attached.
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    await assertion;
    expect(mocks.terminate).toHaveBeenCalled();
  });
});
