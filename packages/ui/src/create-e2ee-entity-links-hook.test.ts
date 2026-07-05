import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const factorySrc = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "create-e2ee-entity-links-hook.ts"
  ),
  "utf8"
);

/** Reads a hook source file from apps/<app>/hooks/<file>. */
function readHookFile(app: string, file: string): string {
  return readFileSync(join(repoRoot, "apps", app, "hooks", file), "utf8");
}

describe("createE2eeEntityLinksHook security wiring", () => {
  it("guards master key before fetch and catalog load", () => {
    expect(factorySrc).toContain("guardE2eeMasterKey");
    expect(factorySrc).toContain("useCSRFToken");
    expect(factorySrc).toContain("useEncryptionContext");
  });

  it("passes link mutations as (entityId, targetId, csrfToken)", () => {
    expect(factorySrc).toContain("config.link(entityId, targetId, csrfToken)");
  });

  it("lazyCatalog mode gates link refresh on options.enabled", () => {
    expect(factorySrc).toContain(
      "const linksEnabled = options?.enabled ?? false"
    );
    expect(factorySrc).toMatch(
      /if \(linksEnabled && isUnlocked && masterKey && entityId\)/
    );
  });

  it("eager mode gates catalog refresh on options.enabled", () => {
    expect(factorySrc).toContain("const enabled = options?.enabled ?? true");
    expect(factorySrc).toMatch(
      /if \(enabled && isUnlocked && masterKey && entityId\)/
    );
  });
});

/**
 * Factory calls `link(entityId, targetId, csrfToken)`. Wrappers must map to the
 * correct server-action argument order (regression guard after consolidation).
 */
describe("entity link hook action argument order", () => {
  it.each([
    {
      app: "contacts",
      hook: "use-task-links.ts",
      linkLine: "link: (contactId, itemId, csrfToken) =>",
      actionCall: "linkTaskEntity(itemId, contactId, csrfToken)",
    },
    {
      app: "contacts",
      hook: "use-note-links.ts",
      linkLine: "link: (contactId, noteId, csrfToken) =>",
      actionCall: "linkNoteEntity(noteId, contactId, csrfToken)",
    },
    {
      app: "notes",
      hook: "use-task-links.ts",
      linkLine: "link: (noteId, itemId, csrfToken) =>",
      actionCall: "linkTaskEntity(itemId, noteId, csrfToken)",
    },
    {
      app: "notes",
      hook: "use-link-entity-links.ts",
      linkLine: "link: (noteId, linkId, csrfToken) =>",
      actionCall: "linkLinkEntity(linkId, noteId, csrfToken)",
    },
    {
      app: "tasks",
      hook: "use-link-entity-links.ts",
      linkLine: "link: (itemId, linkId, csrfToken) =>",
      actionCall: "linkLinkEntity(linkId, itemId, csrfToken)",
    },
    {
      app: "links",
      hook: "use-note-links.ts",
      linkLine: "link: (linkId, noteId, csrfToken) =>",
      actionCall: "linkNoteEntity(noteId, linkId, csrfToken)",
    },
    {
      app: "links",
      hook: "use-task-links.ts",
      linkLine: "link: (linkId, itemId, csrfToken) =>",
      actionCall: "linkTaskEntity(itemId, linkId, csrfToken)",
    },
    {
      app: "links",
      hook: "use-contact-links.ts",
      linkLine: "link: (linkId, contactId, csrfToken) =>",
      actionCall: "linkContactEntity(contactId, linkId, csrfToken)",
    },
    {
      app: "contacts",
      hook: "use-link-entity-links.ts",
      linkLine: "link: (contactId, linkId, csrfToken) =>",
      actionCall: "linkLinkEntity(linkId, contactId, csrfToken)",
    },
  ] as const)(
    "apps/$app hooks/$hook maps factory args to server action",
    ({ app, hook, linkLine, actionCall }) => {
      const src = readHookFile(app, hook);
      expect(src).toContain("createE2eeEntityLinksHook");
      expect(src).toContain(linkLine);
      expect(src).toContain(actionCall);
    }
  );

  it.each([
    ["tasks", "use-contact-links.ts", "link: linkContact"],
    ["tasks", "use-note-links.ts", "link: linkNote"],
    ["notes", "use-contact-links.ts", "link: linkContact"],
  ] as const)(
    "apps/%s/%s passes server actions directly for eager catalog mode",
    (app, hook, linkPattern) => {
      const src = readHookFile(app, hook);
      expect(src).toContain("createE2eeEntityLinksHook");
      expect(src).toContain(linkPattern);
    }
  );
});
