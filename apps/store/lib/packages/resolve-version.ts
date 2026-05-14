import "server-only";

import { createAdminClient } from "@helvety/shared/supabase/admin";

import { getPackageInfo } from "@/lib/packages/config";

/** Minimal shape used from Supabase list responses for sorting. */
interface StorageListItem {
  name?: string;
  id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Returns epoch ms for available timestamps, or 0 when missing/invalid. */
function getNewestTimestamp(item: StorageListItem): number {
  const createdAtMs = item.created_at ? Date.parse(item.created_at) : NaN;
  const updatedAtMs = item.updated_at ? Date.parse(item.updated_at) : NaN;
  const created = Number.isNaN(createdAtMs) ? 0 : createdAtMs;
  const updated = Number.isNaN(updatedAtMs) ? 0 : updatedAtMs;
  return Math.max(created, updated);
}

// =============================================================================
// RESOLVER
// =============================================================================

/**
 * Result of resolving the latest package file from storage.
 */
interface ResolvedPackageVersion {
  /** Version string for display (currently from package config). */
  version: string;
  /** Full object path in the `packages` bucket (e.g. SPFx `.sppkg` or browser extension `.zip`). */
  storagePath: string;
}

/**
 * Resolve the latest package file from Supabase Storage for a package.
 * Lists the package folder and picks the newest file matching `storageFileSuffix` by timestamp.
 *
 * @param packageId - Public download package id (keys in `lib/packages/config.ts`, e.g. `spo-explorer`, `power-automate-editor-version-enforcer`).
 * @returns Resolved version/path or null when package/listing/file lookup fails
 */
export async function resolveLatestPackageVersion(
  packageId: string
): Promise<ResolvedPackageVersion | null> {
  const packageInfo = getPackageInfo(packageId);
  if (!packageInfo) {
    return null;
  }

  const suffixLower = packageInfo.storageFileSuffix.toLowerCase();

  const adminClient = createAdminClient();
  const { data: items, error } = await adminClient.storage
    .from("packages")
    .list(packageInfo.storageFolderPath, {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });

  if (error || !items?.length) {
    return null;
  }

  const packageCandidates: StorageListItem[] = [];
  for (const item of items) {
    const name = item.name;
    if (!name || typeof name !== "string") continue;
    // Exclude folders and keep only package files in this directory level.
    if (!item.id) continue;
    if (!name.toLowerCase().endsWith(suffixLower)) continue;
    packageCandidates.push(item);
  }

  if (packageCandidates.length === 0) {
    return null;
  }

  packageCandidates.sort((a, b) => {
    const timestampDiff = getNewestTimestamp(b) - getNewestTimestamp(a);
    if (timestampDiff !== 0) return timestampDiff;
    return (b.name ?? "").localeCompare(a.name ?? "");
  });

  const latest = packageCandidates[0];
  if (!latest) return null;
  if (!latest.name) return null;

  const storagePath = `${packageInfo.storageFolderPath}/${latest.name}`;
  const version = packageInfo.version;

  return { version, storagePath };
}
