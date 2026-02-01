import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client factory
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
  },
};

vi.mock("@/lib/supabase/client-factory", () => ({
  createServerComponentClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { getCurrentUser, updateUserEmail } from "@/app/actions/account-actions";

describe("account-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return user data when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00Z",
      };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        success: true,
        data: {
          id: "user-123",
          email: "test@example.com",
          createdAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("should return error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        success: false,
        error: "Not authenticated",
      });
    });

    it("should return error when supabase returns error", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Auth error"),
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        success: false,
        error: "Not authenticated",
      });
    });

    it("should handle empty email gracefully", async () => {
      const mockUser = {
        id: "user-123",
        email: null,
        created_at: "2024-01-01T00:00:00Z",
      };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        success: true,
        data: {
          id: "user-123",
          email: "",
          createdAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      mockGetUser.mockRejectedValue(new Error("Unexpected error"));

      const result = await getCurrentUser();

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred",
      });
    });
  });

  describe("updateUserEmail", () => {
    beforeEach(() => {
      // Default: user is authenticated
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: "old@example.com",
          },
        },
        error: null,
      });
    });

    it("should update email successfully", async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await updateUserEmail("new@example.com");

      expect(result).toEqual({ success: true });
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: "new@example.com" });
    });

    it("should reject invalid email format", async () => {
      const result = await updateUserEmail("invalid-email");

      expect(result).toEqual({
        success: false,
        error: "Invalid email format",
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("should reject email without @", async () => {
      const result = await updateUserEmail("invalidemail.com");

      expect(result).toEqual({
        success: false,
        error: "Invalid email format",
      });
    });

    it("should reject email without domain", async () => {
      const result = await updateUserEmail("invalid@");

      expect(result).toEqual({
        success: false,
        error: "Invalid email format",
      });
    });

    it("should reject empty email", async () => {
      const result = await updateUserEmail("");

      expect(result).toEqual({
        success: false,
        error: "Invalid email format",
      });
    });

    it("should reject when not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await updateUserEmail("new@example.com");

      expect(result).toEqual({
        success: false,
        error: "Not authenticated",
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("should reject same email (case-insensitive)", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: "Old@Example.com",
          },
        },
        error: null,
      });

      const result = await updateUserEmail("old@example.com");

      expect(result).toEqual({
        success: false,
        error: "New email must be different from current email",
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("should handle already registered email error", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "Email is already registered" },
      });

      const result = await updateUserEmail("taken@example.com");

      expect(result).toEqual({
        success: false,
        error: "This email is already in use",
      });
    });

    it("should return generic error for other Supabase errors", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "Some other error" },
      });

      const result = await updateUserEmail("new@example.com");

      expect(result).toEqual({
        success: false,
        error: "Some other error",
      });
    });

    it("should handle unexpected errors", async () => {
      mockUpdateUser.mockRejectedValue(new Error("Network error"));

      const result = await updateUserEmail("new@example.com");

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred",
      });
    });

    it("should accept valid email formats", async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      // Test various valid formats
      const validEmails = [
        "simple@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user@subdomain.example.com",
      ];

      for (const email of validEmails) {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue({
          data: { user: { id: "user-123", email: "old@example.com" } },
          error: null,
        });
        mockUpdateUser.mockResolvedValue({ error: null });

        const result = await updateUserEmail(email);
        expect(result.success).toBe(true);
      }
    });
  });
});
