import { describe, expect, it } from "vitest";

import { createPdfErrorInfo, PdfErrorType } from "./pdf-errors";

describe("createPdfErrorInfo", () => {
  it("builds a full sentence for password-protected errors", () => {
    const info = createPdfErrorInfo(
      new Error("Document is password protected"),
      "Can't load 'report.pdf':"
    );
    expect(info.type).toBe(PdfErrorType.PASSWORD_PROTECTED);
    expect(info.message).toBe(
      "Can't load 'report.pdf'. This file is password-protected. Remove the password and try again."
    );
  });

  it("builds a full sentence for unknown errors without a glued lowercase fragment", () => {
    const info = createPdfErrorInfo(
      new Error("weird engine failure"),
      "Can't extract page:"
    );
    expect(info.type).toBe(PdfErrorType.UNKNOWN);
    expect(info.message).toBe(
      "Can't extract page. Something went wrong while processing this file. Please try again."
    );
  });
});
