import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EncryptionTooltipContent } from "./encryption-tooltip-content";

describe("EncryptionTooltipContent", () => {
  it("renders heading, caller body, and shared passkey lockout disclaimer", () => {
    render(
      <EncryptionTooltipContent body={<p>App-specific encryption copy.</p>} />
    );

    expect(screen.getByText("Client-Side Encryption")).toBeInTheDocument();
    expect(
      screen.getByText("App-specific encryption copy.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Helvety cannot restore access/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/built-in password app with cloud sync/i)
    ).toBeInTheDocument();
  });
});
