import { describe, expect, it } from "vitest";

import {
  base64Decode,
  base64Encode,
  constantTimeEqual,
  generateIV,
  generateSalt,
} from "./encoding";

describe("base64Encode / base64Decode", () => {
  it("round-trips arbitrary bytes", () => {
    const original = new Uint8Array([0, 1, 127, 128, 255]);
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);
    expect(decoded).toEqual(original);
  });

  it("round-trips empty array", () => {
    const original = new Uint8Array([]);
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);
    expect(decoded).toEqual(original);
  });

  it("produces a valid base64 string", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = base64Encode(data);
    expect(encoded).toBe("SGVsbG8=");
  });
});

describe("generateSalt", () => {
  it("produces 16 bytes by default", () => {
    const salt = generateSalt();
    expect(salt.length).toBe(16);
  });

  it("respects custom length", () => {
    const salt = generateSalt(32);
    expect(salt.length).toBe(32);
  });

  it("produces different values on consecutive calls", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).not.toEqual(b);
  });
});

describe("generateIV", () => {
  it("produces 12 bytes (NIST recommendation for AES-GCM)", () => {
    const iv = generateIV();
    expect(iv.length).toBe(12);
  });

  it("produces different values on consecutive calls", () => {
    const a = generateIV();
    const b = generateIV();
    expect(a).not.toEqual(b);
  });
});

describe("constantTimeEqual", () => {
  it("returns true for identical arrays", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it("returns false for different arrays", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 4]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("returns false for arrays of different lengths", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("returns true for empty arrays", () => {
    const a = new Uint8Array([]);
    const b = new Uint8Array([]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });
});
