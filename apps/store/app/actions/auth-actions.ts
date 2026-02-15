"use server";

import "server-only";

// Note: Authentication is handled by the centralized auth service at auth.helvety.com.
// This app receives sessions via shared cookies on the .helvety.com domain.
// AuthResponse type is exported from @/lib/types/store for consistency.
export type { AuthResponse } from "@/lib/types/store";

