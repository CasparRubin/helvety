import { describe, expect, it } from "vitest";

import {
  areArraysEqual,
  areRotationsEqual,
  areSetsEqual,
} from "./comparison-utils";

describe("areArraysEqual", () => {
  it("compares by reference and shallow content", () => {
    const a = [1, 2, 3];
    expect(areArraysEqual(a, a)).toBe(true);
    expect(areArraysEqual(a, [1, 2, 3])).toBe(true);
    expect(areArraysEqual(a, [1, 2])).toBe(false);
    expect(areArraysEqual(a, [1, 2, 4])).toBe(false);
  });
});

describe("areSetsEqual", () => {
  it("compares set membership", () => {
    expect(areSetsEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(areSetsEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });
});

describe("areRotationsEqual", () => {
  it("compares rotation records by keys and values", () => {
    expect(areRotationsEqual({ 1: 90, 2: 180 }, { 1: 90, 2: 180 })).toBe(true);
    expect(areRotationsEqual({ 1: 90 }, { 1: 270 })).toBe(false);
    expect(areRotationsEqual({ 1: 90 }, { 1: 90, 2: 0 })).toBe(false);
    expect(areRotationsEqual({}, {})).toBe(true);
  });
});
