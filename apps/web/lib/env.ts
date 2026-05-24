import "server-only";

import { getValidatedGatewayEnv } from "@helvety/shared/env-validation";

/**
 * Validates gateway rewrite URLs on first call, then caches.
 *
 * See `@helvety/shared/env-validation` → `getValidatedGatewayEnv`.
 */
export const getValidatedWebEnv = getValidatedGatewayEnv;
