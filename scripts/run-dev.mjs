/**
 * Starts all zone dev servers via Turbo and warms each port before logging readiness.
 * Reduces gateway rewrite ECONNRESET when sub-zones are still compiling on first hit.
 */
import { spawn } from "node:child_process";

import { DEV_ALL_ZONES_READY_SENTINEL, ZONE_PORTS } from "./dev-zone-ports.mjs";

const WARMUP_DELAY_MS = 4000;
const POLL_INTERVAL_MS = 500;
const MAX_ATTEMPTS = 120;

/**
 * @param {number} port
 */
async function waitForPort(port) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        redirect: "manual",
        signal: AbortSignal.timeout(1500),
      });
      if (response.status < 500) {
        return true;
      }
    } catch {
      // Zone still starting or compiling.
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

async function warmZones() {
  await new Promise((resolve) => setTimeout(resolve, WARMUP_DELAY_MS));
  console.log("\n[dev] Warming zone dev servers...");
  const results = await Promise.all(
    ZONE_PORTS.map(async (port) => ({
      port,
      ready: await waitForPort(port),
    }))
  );
  const missing = results.filter((result) => !result.ready);
  if (missing.length === 0) {
    console.log(
      `${DEV_ALL_ZONES_READY_SENTINEL} Gateway: http://localhost:3001\n`
    );
    return;
  }
  console.warn(
    `[dev] ${missing.length} zone(s) still starting (${missing.map((m) => m.port).join(", ")}). Refresh if a rewrite fails.\n`
  );
}

const child = spawn("bun", ["run", "turbo", "run", "dev", "--concurrency=11"], {
  stdio: "inherit",
});

void warmZones();

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
