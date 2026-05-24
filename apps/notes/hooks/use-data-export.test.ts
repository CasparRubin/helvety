import { useE2eeDataExport } from "@helvety/ui/hooks/use-e2ee-data-export";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { downloadNoteDataExport } from "@/lib/data-export";

import { useDataExport } from "./use-data-export";

vi.mock("@helvety/ui/hooks/use-e2ee-data-export", () => ({
  useE2eeDataExport: vi.fn(() => ({
    exportData: vi.fn(),
    isExporting: false,
  })),
}));

vi.mock("@/lib/data-export", () => ({
  downloadNoteDataExport: vi.fn(),
}));

describe("useDataExport", () => {
  it("delegates export behavior to the shared E2EE data export hook", () => {
    renderHook(() => useDataExport(null));

    expect(vi.mocked(useE2eeDataExport)).toHaveBeenCalledWith(
      null,
      downloadNoteDataExport
    );
  });
});
