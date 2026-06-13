import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useE2eeDataExport } from "./use-e2ee-data-export";

const logUnexpectedError = vi.fn();
const toastError = vi.fn();

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: (...args: unknown[]) => logUnexpectedError(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const masterKey = {} as CryptoKey;

describe("useE2eeDataExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when masterKey is null", async () => {
    const downloadFn = vi.fn();
    const { result } = renderHook(() => useE2eeDataExport(null, downloadFn));

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(downloadFn).not.toHaveBeenCalled();
    expect(result.current.isExporting).toBe(false);
  });

  it("calls the zone download function with the master key", async () => {
    const downloadFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useE2eeDataExport(masterKey, downloadFn)
    );

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(downloadFn).toHaveBeenCalledWith(masterKey);
    expect(result.current.isExporting).toBe(false);
  });

  it("logs and toasts when export fails", async () => {
    const downloadFn = vi.fn().mockRejectedValue(new Error("Export denied"));
    const { result } = renderHook(() =>
      useE2eeDataExport(masterKey, downloadFn)
    );

    await act(async () => {
      await result.current.handleExportData();
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(logUnexpectedError).toHaveBeenCalledWith(
      "Data export failed",
      expect.any(Error)
    );
    expect(toastError).toHaveBeenCalled();
  });
});
