import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const dynamicMock = vi.hoisted(() => ({
  lastOptions: undefined as
    | {
        ssr?: boolean;
        loading?: () => JSX.Element;
      }
    | undefined,
}));

vi.mock("next/dynamic", () => ({
  default: vi.fn((_loader, options) => {
    dynamicMock.lastOptions = options;
    return function DynamicStub() {
      return <div data-testid="dynamic-stub" />;
    };
  }),
}));

import { createHelvetyWebglDynamic } from "./create-helvety-webgl-dynamic";
import { WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS } from "./webgl-backdrop";

describe("createHelvetyWebglDynamic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    dynamicMock.lastOptions = undefined;
  });

  it("disables SSR and renders a black loading slot", () => {
    createHelvetyWebglDynamic(
      () => Promise.resolve({ default: () => <div /> }),
      "test-webgl-loading"
    );

    expect(dynamicMock.lastOptions?.ssr).toBe(false);

    const Loading = dynamicMock.lastOptions?.loading;
    expect(Loading).toEqual(expect.any(Function));

    const { getByTestId } = render(Loading!());
    const slot = getByTestId("test-webgl-loading");
    expect(slot).toHaveClass("bg-black");
    expect(slot).toHaveAttribute("aria-hidden", "true");
    for (const token of WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS.split(/\s+/)) {
      expect(slot).toHaveClass(token);
    }
  });
});
