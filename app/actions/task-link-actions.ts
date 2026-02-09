"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";

import type {
  ActionResponse,
  EntityContactLinkRow,
  TaskLinkData,
} from "@/lib/types";

// =============================================================================
// TASK LINK ACTIONS (read-only, links are managed in helvety-tasks)
// =============================================================================

/**
 * Get all task entity links for a specific contact.
 *
 * Queries the shared `entity_contact_links` table for all links where
 * `contact_id` matches, then batch-fetches the corresponding entities
 * (units, spaces, items) to provide encrypted titles and parent IDs
 * needed for deep link construction.
 *
 * For items, the parent space is also fetched to resolve `unit_id`
 * (needed for the Tasks app deep link URL).
 *
 * @param contactId - The contact UUID to find links for
 * @returns Grouped task link data with encrypted entity titles
 */
export async function getContactTaskLinks(
  contactId: string
): Promise<ActionResponse<TaskLinkData>> {
  try {
    if (!z.string().uuid().safeParse(contactId).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { supabase } = auth.ctx;

    // 1. Fetch all entity_contact_links for this contact
    const { data: links, error: linksError } = await supabase
      .from("entity_contact_links")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true })
      .returns<EntityContactLinkRow[]>();

    if (linksError) {
      logger.error("Error getting task links:", linksError);
      return { success: false, error: "Failed to get task links" };
    }

    if (!links || links.length === 0) {
      return {
        success: true,
        data: { units: [], spaces: [], items: [] },
      };
    }

    // 2. Group link IDs by entity type
    const unitLinks = links.filter((l) => l.entity_type === "unit");
    const spaceLinks = links.filter((l) => l.entity_type === "space");
    const itemLinks = links.filter((l) => l.entity_type === "item");

    const unitIds = unitLinks.map((l) => l.entity_id);
    const spaceIds = spaceLinks.map((l) => l.entity_id);
    const itemIds = itemLinks.map((l) => l.entity_id);

    // 3. Batch-fetch entities in parallel (only the fields we need)
    const [unitsResult, spacesResult, itemsResult] = await Promise.all([
      unitIds.length > 0
        ? supabase
            .from("units")
            .select("id, encrypted_title")
            .in("id", unitIds)
            .returns<{ id: string; encrypted_title: string }[]>()
        : Promise.resolve({
            data: [] as { id: string; encrypted_title: string }[],
            error: null,
          }),

      spaceIds.length > 0
        ? supabase
            .from("spaces")
            .select("id, unit_id, encrypted_title")
            .in("id", spaceIds)
            .returns<
              { id: string; unit_id: string; encrypted_title: string }[]
            >()
        : Promise.resolve({
            data: [] as {
              id: string;
              unit_id: string;
              encrypted_title: string;
            }[],
            error: null,
          }),

      itemIds.length > 0
        ? supabase
            .from("items")
            .select("id, space_id, encrypted_title")
            .in("id", itemIds)
            .returns<
              { id: string; space_id: string; encrypted_title: string }[]
            >()
        : Promise.resolve({
            data: [] as {
              id: string;
              space_id: string;
              encrypted_title: string;
            }[],
            error: null,
          }),
    ]);

    if (unitsResult.error) {
      logger.error("Error fetching linked units:", unitsResult.error);
      return { success: false, error: "Failed to fetch linked units" };
    }
    if (spacesResult.error) {
      logger.error("Error fetching linked spaces:", spacesResult.error);
      return { success: false, error: "Failed to fetch linked spaces" };
    }
    if (itemsResult.error) {
      logger.error("Error fetching linked items:", itemsResult.error);
      return { success: false, error: "Failed to fetch linked items" };
    }

    const units = unitsResult.data ?? [];
    const spaces = spacesResult.data ?? [];
    const items = itemsResult.data ?? [];

    // 4. For items, resolve unit_id via their parent spaces
    const itemSpaceIds = [...new Set(items.map((i) => i.space_id))];

    const spaceUnitMap: Record<string, string> = {};

    if (itemSpaceIds.length > 0) {
      // Some parent spaces might already be in spaceIds (fetched above)
      const alreadyFetched = new Map(spaces.map((s) => [s.id, s.unit_id]));

      const missingSpaceIds = itemSpaceIds.filter(
        (id) => !alreadyFetched.has(id)
      );

      if (missingSpaceIds.length > 0) {
        const { data: parentSpaces, error: parentError } = await supabase
          .from("spaces")
          .select("id, unit_id")
          .in("id", missingSpaceIds)
          .returns<{ id: string; unit_id: string }[]>();

        if (parentError) {
          logger.error("Error fetching parent spaces for items:", parentError);
          return {
            success: false,
            error: "Failed to resolve item parent hierarchy",
          };
        }

        for (const ps of parentSpaces ?? []) {
          spaceUnitMap[ps.id] = ps.unit_id;
        }
      }

      // Merge already-fetched spaces into the map
      for (const [id, unitId] of alreadyFetched) {
        spaceUnitMap[id] = unitId;
      }
    }

    // 5. Build link maps for efficient lookup
    const unitLinkMap = new Map(
      unitLinks.map((l) => [
        l.entity_id,
        { link_id: l.id, linked_at: l.created_at },
      ])
    );
    const spaceLinkMap = new Map(
      spaceLinks.map((l) => [
        l.entity_id,
        { link_id: l.id, linked_at: l.created_at },
      ])
    );
    const itemLinkMap = new Map(
      itemLinks.map((l) => [
        l.entity_id,
        { link_id: l.id, linked_at: l.created_at },
      ])
    );

    // 6. Assemble the response
    const data: TaskLinkData = {
      units: units
        .map((u) => {
          const link = unitLinkMap.get(u.id);
          if (!link) return null;
          return {
            id: u.id,
            encrypted_title: u.encrypted_title,
            link_id: link.link_id,
            linked_at: link.linked_at,
          };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null),

      spaces: spaces
        .map((s) => {
          const link = spaceLinkMap.get(s.id);
          if (!link) return null;
          return {
            id: s.id,
            unit_id: s.unit_id,
            encrypted_title: s.encrypted_title,
            link_id: link.link_id,
            linked_at: link.linked_at,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),

      items: items
        .map((i) => {
          const link = itemLinkMap.get(i.id);
          if (!link) return null;
          const unitId = spaceUnitMap[i.space_id];
          if (!unitId) return null; // Skip if parent hierarchy can't be resolved
          return {
            id: i.id,
            space_id: i.space_id,
            unit_id: unitId,
            encrypted_title: i.encrypted_title,
            link_id: link.link_id,
            linked_at: link.linked_at,
          };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null),
    };

    return { success: true, data };
  } catch (error) {
    logger.error("Unexpected error in getContactTaskLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
