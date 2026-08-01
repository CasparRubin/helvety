import { CONTACT_EMAIL } from "@helvety/shared/config";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  back: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mocks.back }),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: mocks.logUnexpectedError },
}));

import { AppError } from "./app-error";

describe("AppError", () => {
  it("shows default title, contact mailto, and calls reset", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      GENERIC_USER_ERROR
    );
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`
    );
    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Application error",
      error
    );
  });

  it("renders Go home when homeHref is set", () => {
    render(
      <AppError
        error={new Error("x")}
        reset={vi.fn()}
        homeHref="/"
        title="Custom failure"
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Custom failure"
    );
    expect(screen.getByRole("button", { name: /Go home/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders Go back when showBackButton is set", () => {
    render(<AppError error={new Error("x")} reset={vi.fn()} showBackButton />);

    fireEvent.click(screen.getByRole("button", { name: /Go back/i }));
    expect(mocks.back).toHaveBeenCalledTimes(1);
  });
});
