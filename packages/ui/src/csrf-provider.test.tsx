import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CSRFProvider, useCSRFToken, useSetCSRFToken } from "./csrf-provider";

/** Test helper that renders the current CSRF token from context. */
function TokenReader() {
  return <span data-testid="token">{useCSRFToken()}</span>;
}

/** Test helper that applies a rotated token through `useSetCSRFToken`. */
function TokenUpdater({ next }: { next: string }) {
  const setToken = useSetCSRFToken();
  return (
    <button type="button" onClick={() => setToken(next)}>
      rotate
    </button>
  );
}

describe("useSetCSRFToken", () => {
  it("throws outside CSRFProvider", () => {
    expect(() => {
      /** Renders outside `CSRFProvider` to assert hook guard behavior. */
      function BadConsumer() {
        useSetCSRFToken();
        return null;
      }
      render(<BadConsumer />);
    }).toThrow("useSetCSRFToken must be used within a CSRFProvider");
  });
});

describe("CSRFProvider", () => {
  it("exposes the server-provided token to consumers", () => {
    render(
      <CSRFProvider csrfToken="layout-token">
        <TokenReader />
      </CSRFProvider>
    );

    expect(screen.getByTestId("token")).toHaveTextContent("layout-token");
  });

  it("updates client-held token via useSetCSRFToken", () => {
    render(
      <CSRFProvider csrfToken="layout-token">
        <TokenReader />
        <TokenUpdater next="rotated-token" />
      </CSRFProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "rotate" }));

    expect(screen.getByTestId("token")).toHaveTextContent("rotated-token");
  });

  it("resyncs when the csrfToken prop changes", () => {
    const { rerender } = render(
      <CSRFProvider csrfToken="initial-token">
        <TokenReader />
      </CSRFProvider>
    );

    rerender(
      <CSRFProvider csrfToken="refreshed-layout-token">
        <TokenReader />
      </CSRFProvider>
    );

    expect(screen.getByTestId("token")).toHaveTextContent(
      "refreshed-layout-token"
    );
  });
});
