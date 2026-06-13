import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPlaintextExportWarning,
  downloadEncryptedJsonExport,
} from "./e2ee-json-export";

describe("buildPlaintextExportWarning", () => {
  it("parameterizes the entity label", () => {
    expect(buildPlaintextExportWarning("contact")).toContain(
      "plaintext contact data"
    );
  });
});

describe("downloadEncryptedJsonExport", () => {
  const masterKey = {} as CryptoKey;
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let anchor: HTMLAnchorElement;

  beforeEach(() => {
    anchor = document.createElement("a");
    clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => undefined);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return anchor;
      }
      return document.createElement(tagName);
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips download when confirmation is declined", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const buildExportData = vi.fn();

    await downloadEncryptedJsonExport({
      masterKey,
      buildExportData,
      filenamePrefix: "helvety-contacts-export",
      entityLabel: "contact",
    });

    expect(window.confirm).toHaveBeenCalledWith(
      buildPlaintextExportWarning("contact")
    );
    expect(buildExportData).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("downloads JSON when confirmation is accepted", async () => {
    const buildExportData = vi.fn().mockResolvedValue({ items: [] });

    await downloadEncryptedJsonExport({
      masterKey,
      buildExportData,
      filenamePrefix: "helvety-tasks-export",
      entityLabel: "task",
    });

    expect(buildExportData).toHaveBeenCalledWith(masterKey);
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:export");
    expect(anchor.download).toMatch(
      /^helvety-tasks-export-\d{4}-\d{2}-\d{2}\.json$/
    );
  });

  it("skips confirmation when requireConfirmation is false", async () => {
    const buildExportData = vi.fn().mockResolvedValue({ links: [] });

    await downloadEncryptedJsonExport({
      masterKey,
      buildExportData,
      filenamePrefix: "helvety-links-export",
      entityLabel: "bookmark",
      requireConfirmation: false,
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
