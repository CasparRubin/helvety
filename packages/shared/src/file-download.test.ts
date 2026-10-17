import { describe, expect, it, vi, afterEach } from "vitest";

import { downloadBlob, sanitizeDownloadFilename } from "./file-download";

const LIMITS = { maxLength: 200, defaultName: "download" } as const;

describe("sanitizeDownloadFilename", () => {
  it("strips path separators and null bytes", () => {
    expect(sanitizeDownloadFilename("folder/name.pdf\0", LIMITS)).toBe(
      "foldername.pdf"
    );
  });

  it("falls back to the default name for empty or reserved names", () => {
    expect(sanitizeDownloadFilename("..", LIMITS)).toBe("download");
    expect(sanitizeDownloadFilename(".", LIMITS)).toBe("download");
    expect(sanitizeDownloadFilename("   ", LIMITS)).toBe("download");
  });

  it("truncates long names while preserving the extension", () => {
    const longName = `${"a".repeat(250)}.pdf`;
    const result = sanitizeDownloadFilename(longName, LIMITS);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("truncates long names without an extension", () => {
    const result = sanitizeDownloadFilename("a".repeat(300), LIMITS);
    expect(result.length).toBe(200);
  });
});

describe("downloadBlob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a temporary anchor and revokes the object URL", () => {
    vi.useFakeTimers();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const click = vi.fn();
    const appendChild = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeChild = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
    vi.spyOn(document, "createElement").mockImplementation(() => {
      return {
        href: "",
        download: "",
        style: { display: "" },
        click,
      } as unknown as HTMLAnchorElement;
    });

    downloadBlob(new Blob(["x"]), "report.pdf", LIMITS, 50);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(50);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    vi.useRealTimers();
  });
});
