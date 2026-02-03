import "server-only";

import { getPackageInfo } from "@/lib/packages/config";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// VERSION PARSING
// =============================================================================

/** Match optional leading "v" and then digits/dots (e.g. v1.0.1.1 or 1.0.0.4) */
const VERSION_FOLDER_REGEX = /^v?(\d+(?:\.\d+)*)$/;

/**
 * Parse a version folder name into numeric segments for comparison.
 * @param name - Folder name (e.g. "v1.0.1.1" or "1.0.0.4")
 * @returns Array of numbers, or null if not a valid version string
 */
function parseVersionSegments(name: string): number[] | null {
  const match = name.trim().match(VERSION_FOLDER_REGEX);
  const versionPart = match?.[1];
  if (!versionPart) return null;
  const segments = versionPart.split(".").map((s) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? 0 : n;
  });
  return segments;
}

/**
 * Compare two version segment arrays (a - b). Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareVersionSegments(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

/**
 * Normalize version string for display (strip leading "v").
 */
function normalizeVersionDisplay(folderName: string): string {
  const trimmed = folderName.trim();
  return trimmed.startsWith("v") ? trimmed.slice(1) : trimmed;
}

// =============================================================================
// RESOLVER
// =============================================================================

export interface ResolvedPackageVersion {
  /** Version string for display (e.g. "1.0.1.1") */
  version: string;
  /** Full storage path for the file (e.g. "spfx/helvety-spo-explorer/v1.0.1.1/helvety-spo-explorer.sppkg") */
  storagePath: string;
}

/**
 * Resolve the latest package version from Supabase Storage for versioned packages.
 * Lists the package's storagePathPrefix folder, parses version-like subfolder names,
 * and returns the latest version and full storage path.
 *
 * @param packageId - Package identifier (e.g. "spo-explorer")
 * @returns Resolved version and path, or null if package is not versioned, list fails, or no versions found
 */
export async function resolveLatestPackageVersion(
  packageId: string
): Promise<ResolvedPackageVersion | null> {
  const packageInfo = getPackageInfo(packageId);
  if (!packageInfo?.storagePathPrefix) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: items, error } = await adminClient.storage
    .from("packages")
    .list(packageInfo.storagePathPrefix, {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });

  if (error || !items?.length) {
    return null;
  }

  const versionCandidates: { folderName: string; segments: number[] }[] = [];
  for (const item of items) {
    const name = item.name;
    if (!name || typeof name !== "string") continue;
    const segments = parseVersionSegments(name);
    if (segments) {
      versionCandidates.push({ folderName: name, segments });
    }
  }

  if (versionCandidates.length === 0) {
    return null;
  }

  versionCandidates.sort((a, b) => -compareVersionSegments(a.segments, b.segments));
  const latest = versionCandidates[0];
  if (!latest) return null;

  const storagePath = `${packageInfo.storagePathPrefix}/${latest.folderName}/${packageInfo.filename}`;
  const version = normalizeVersionDisplay(latest.folderName);

  return { version, storagePath };
}
