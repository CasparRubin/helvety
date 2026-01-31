"use server";

import "server-only";

/**
 * Auth response type for server actions
 */
export type AuthResponse = {
  success: boolean;
  error?: string;
};

// Note: Password-based login is not used in this app.
// We use Supabase magic links via signInWithOtp on the client.
// This file exports only the AuthResponse type for consistency.
