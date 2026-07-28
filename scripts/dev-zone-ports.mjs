/**
 * Direct zone dev ports warmed by `scripts/run-dev.mjs`.
 * Keep in sync with `packages/shared/src/config.ts` `DEV_PORTS`.
 */
export const ZONE_PORTS = [3001, 3003, 3004, 3010, 3011];

/** Log line emitted when every zone port responds (see `run-dev.mjs`). */
export const DEV_ALL_ZONES_READY_SENTINEL = `[dev] All ${ZONE_PORTS.length} zones ready.`;
