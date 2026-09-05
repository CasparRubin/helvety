import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";

/** Combined lowercase company values (no trailing period); kept for tests and copy checks. */
export const HERO_COMPANY_VALUES_TAGLINE_TEXT =
  HELVETY_COMPANY_VALUES_TAGLINE.replace(/\.$/, "").toLowerCase();

/** Hero tagline with middle-dot separators derived from {@link HELVETY_COMPANY_VALUES_TAGLINE}. */
export const HERO_COMPANY_VALUES_TAGLINE_DISPLAY =
  HELVETY_COMPANY_VALUES_TAGLINE.replace(/\.$/, "")
    .split(/,\s*/)
    .map((value) => value.toLowerCase())
    .join(" · ");
