import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DEV_ALL_ZONES_READY_SENTINEL,
  ZONE_PORTS,
} from "../../../scripts/dev-zone-ports.mjs";

import { DEV_PORTS } from "./config";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a repository script for static wiring assertions. */
function readScript(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("dev zone ports wiring", () => {
  it("ZONE_PORTS matches sorted DEV_PORTS values", () => {
    const configPorts = Object.values(DEV_PORTS).sort((a, b) => a - b);
    expect([...ZONE_PORTS].sort((a, b) => a - b)).toEqual(configPorts);
    expect(ZONE_PORTS).toHaveLength(11);
  });

  it("readiness sentinel reflects the warmed zone count", () => {
    expect(DEV_ALL_ZONES_READY_SENTINEL).toBe("[dev] All 11 zones ready.");
  });

  it("run-dev.mjs imports shared zone ports and logs the sentinel prefix", () => {
    const src = readScript("scripts/run-dev.mjs");
    expect(src).toContain('from "./dev-zone-ports.mjs"');
    expect(src).toContain("DEV_ALL_ZONES_READY_SENTINEL");
    expect(src).toContain("ZONE_PORTS");
    expect(src).toContain("--concurrency=11");
  });

  it("run-e2e-smoke.mjs waits on the shared readiness sentinel", () => {
    const src = readScript("scripts/run-e2e-smoke.mjs");
    expect(src).toContain('from "./dev-zone-ports.mjs"');
    expect(src).toContain("DEV_ALL_ZONES_READY_SENTINEL");
    expect(src).not.toContain("All 9 zones ready");
  });
});
