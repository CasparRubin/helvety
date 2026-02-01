"use server";

import "server-only";

/**
 * Auth response type for server actions
 */
export type AuthResponse = {
  success: boolean;
  error?: string;
};

// Note: Authentication is handled by the centralized auth service at auth.helvety.com.
// This app receives sessions via shared cookies on the .helvety.com domain.
// This file exports only the AuthResponse type for consistency.
