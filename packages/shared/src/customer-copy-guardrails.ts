/**
 * Shared rules for customer-facing product copy (Store catalog, llms.txt, legal
 * product bullets). Used by Vitest guardrails to catch drift after copy refreshes.
 */

/** U+2014 em-dash; customer copy must use commas or periods instead. */
export const CUSTOMER_COPY_EM_DASH = "\u2014";

/**
 * Retired or misleading phrases from pre-2026 store copy. Substring match unless
 * noted otherwise in tests.
 */
export const CUSTOMER_COPY_BANNED_SUBSTRINGS = [
  "Feedback tab",
  "encrypted productivity",
  "Kanban-style",
  "kanban tasks",
  "Allows you to enforce either the Classic",
  "v3=false",
  "v3=true",
  "stitch, rotate",
  "carve out",
  "Swiss roots",
  "MIT License",
  "MIT-licensed",
  "where the repo ships",
  "applicable open-source license",
  "Free and open source",
  ">Open Source<",
] as const;

/** Repo-relative app and root README intros (developer docs; keep tone aligned with Store). */
export const CUSTOMER_COPY_README_RELATIVE_PATHS = [
  "README.md",
  "apps/pdf/README.md",
  "apps/tasks/README.md",
  "apps/contacts/README.md",
  "apps/notes/README.md",
  "apps/auth/README.md",
  "apps/store/README.md",
  "apps/web/README.md",
  "apps/image-upscaler/README.md",
] as const;

/** Repo-relative paths to hand-maintained `public/llms.txt` summaries. */
export const CUSTOMER_COPY_LLMS_RELATIVE_PATHS = [
  "apps/web/public/llms.txt",
  "apps/store/public/llms.txt",
  "apps/pdf/public/llms.txt",
  "apps/tasks/public/llms.txt",
  "apps/contacts/public/llms.txt",
  "apps/notes/public/llms.txt",
  "apps/auth/public/llms.txt",
  "apps/image-upscaler/public/llms.txt",
] as const;

/** Minimum chars shared between card blurb and About intro (see store products.test). */
export const CUSTOMER_COPY_HERO_ABOUT_PREFIX_OVERLAP_MAX = 60;

/** Returns true when `text` includes the U+2014 em-dash character. */
export function customerCopyContainsEmDash(text: string): boolean {
  return text.includes(CUSTOMER_COPY_EM_DASH);
}

/**
 * Returns the first banned legacy substring found in `text`, if any.
 * @param text Customer-facing copy to scan.
 */
export function findBannedCustomerCopySubstring(
  text: string
): (typeof CUSTOMER_COPY_BANNED_SUBSTRINGS)[number] | undefined {
  for (const phrase of CUSTOMER_COPY_BANNED_SUBSTRINGS) {
    if (text.includes(phrase)) {
      return phrase;
    }
  }
  return undefined;
}
