import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("auth-redirect", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = originalNodeEnv;
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe("getLoginUrl", () => {
    describe("in development mode", () => {
      beforeEach(async () => {
        (process.env as { NODE_ENV: string }).NODE_ENV = "development";
        vi.resetModules();
      });

      it("should return localhost auth URL with provided currentUrl", async () => {
        const { getLoginUrl } = await import("@/lib/auth-redirect");
        const result = getLoginUrl("http://localhost:3001/products");
        expect(result).toBe(
          "http://localhost:3002/login?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fproducts"
        );
      });

      it("should return localhost auth URL with server-side fallback", async () => {
        // Simulate server-side (no window)
        // @ts-expect-error - intentionally setting window to undefined for testing
        global.window = undefined;
        const { getLoginUrl } = await import("@/lib/auth-redirect");
        const result = getLoginUrl();
        expect(result).toBe(
          "http://localhost:3002/login?redirect_uri=http%3A%2F%2Flocalhost%3A3001"
        );
      });

      it("should use window.location.href when available and no currentUrl provided", async () => {
        global.window = {
          location: { href: "http://localhost:3001/dashboard" },
        } as unknown as Window & typeof globalThis;
        const { getLoginUrl } = await import("@/lib/auth-redirect");
        const result = getLoginUrl();
        expect(result).toBe(
          "http://localhost:3002/login?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fdashboard"
        );
      });
    });

    describe("in production mode", () => {
      beforeEach(async () => {
        (process.env as { NODE_ENV: string }).NODE_ENV = "production";
        vi.resetModules();
      });

      it("should return production auth URL with provided currentUrl", async () => {
        const { getLoginUrl } = await import("@/lib/auth-redirect");
        const result = getLoginUrl("https://store.helvety.com/products");
        expect(result).toBe(
          "https://auth.helvety.com/login?redirect_uri=https%3A%2F%2Fstore.helvety.com%2Fproducts"
        );
      });

      it("should return production auth URL with server-side fallback", async () => {
        // @ts-expect-error - intentionally setting window to undefined for testing
        global.window = undefined;
        const { getLoginUrl } = await import("@/lib/auth-redirect");
        const result = getLoginUrl();
        expect(result).toBe(
          "https://auth.helvety.com/login?redirect_uri=https%3A%2F%2Fstore.helvety.com"
        );
      });
    });
  });

  describe("getLogoutUrl", () => {
    describe("in development mode", () => {
      beforeEach(async () => {
        (process.env as { NODE_ENV: string }).NODE_ENV = "development";
        vi.resetModules();
      });

      it("should return localhost logout URL with provided redirectUri", async () => {
        const { getLogoutUrl } = await import("@/lib/auth-redirect");
        const result = getLogoutUrl("http://localhost:3001/goodbye");
        expect(result).toBe(
          "http://localhost:3002/logout?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fgoodbye"
        );
      });

      it("should return localhost logout URL with default redirect", async () => {
        const { getLogoutUrl } = await import("@/lib/auth-redirect");
        const result = getLogoutUrl();
        expect(result).toBe(
          "http://localhost:3002/logout?redirect_uri=http%3A%2F%2Flocalhost%3A3001"
        );
      });
    });

    describe("in production mode", () => {
      beforeEach(async () => {
        (process.env as { NODE_ENV: string }).NODE_ENV = "production";
        vi.resetModules();
      });

      it("should return production logout URL with provided redirectUri", async () => {
        const { getLogoutUrl } = await import("@/lib/auth-redirect");
        const result = getLogoutUrl("https://store.helvety.com/goodbye");
        expect(result).toBe(
          "https://auth.helvety.com/logout?redirect_uri=https%3A%2F%2Fstore.helvety.com%2Fgoodbye"
        );
      });

      it("should return production logout URL with default redirect", async () => {
        const { getLogoutUrl } = await import("@/lib/auth-redirect");
        const result = getLogoutUrl();
        expect(result).toBe(
          "https://auth.helvety.com/logout?redirect_uri=https%3A%2F%2Fstore.helvety.com"
        );
      });
    });
  });

  describe("redirectToLogin", () => {
    it("should redirect to login URL when window is available", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "development";
      vi.resetModules();

      const mockLocation = { href: "" };
      // @ts-expect-error - mocking window for testing
      global.window = { location: mockLocation };

      const { redirectToLogin } = await import("@/lib/auth-redirect");
      redirectToLogin("http://localhost:3001/page");

      expect(mockLocation.href).toBe(
        "http://localhost:3002/login?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fpage"
      );
    });

    it("should not throw when window is undefined", async () => {
      // @ts-expect-error - intentionally setting window to undefined for testing
      global.window = undefined;
      vi.resetModules();

      const { redirectToLogin } = await import("@/lib/auth-redirect");
      expect(() => redirectToLogin()).not.toThrow();
    });
  });

  describe("redirectToLogout", () => {
    it("should redirect to logout URL when window is available", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "development";
      vi.resetModules();

      const mockLocation = { href: "" };
      // @ts-expect-error - mocking window for testing
      global.window = { location: mockLocation };

      const { redirectToLogout } = await import("@/lib/auth-redirect");
      redirectToLogout("http://localhost:3001/bye");

      expect(mockLocation.href).toBe(
        "http://localhost:3002/logout?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fbye"
      );
    });

    it("should not throw when window is undefined", async () => {
      // @ts-expect-error - intentionally setting window to undefined for testing
      global.window = undefined;
      vi.resetModules();

      const { redirectToLogout } = await import("@/lib/auth-redirect");
      expect(() => redirectToLogout()).not.toThrow();
    });
  });

  describe("URL encoding", () => {
    it("should properly encode special characters in URLs", async () => {
      (process.env as { NODE_ENV: string }).NODE_ENV = "development";
      vi.resetModules();

      const { getLoginUrl } = await import("@/lib/auth-redirect");
      const result = getLoginUrl("http://localhost:3001/search?q=test&page=1");
      expect(result).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fsearch%3Fq%3Dtest%26page%3D1"
      );
    });
  });
});
