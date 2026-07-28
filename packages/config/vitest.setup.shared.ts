import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

expect.extend(matchers);

// jsdom does not implement document.elementFromPoint; stub for viewport helpers in tests.
if (typeof document.elementFromPoint !== "function") {
  document.elementFromPoint = () => null;
}

afterEach(() => {
  cleanup();
});
