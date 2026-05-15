import {
  HELVETY_COMPANY_VALUES_TAGLINE,
  HELVETY_SWISS_BUILT_SUFFIX,
  HELVETY_SWISS_ORIGIN_SEO,
} from "./licensing";

/** Default helvety.com marketing blurb (metadata, OG, Twitter, JSON-LD). */
export const WEB_SITE_DESCRIPTION = `${HELVETY_COMPANY_VALUES_TAGLINE} Software with a calm UX: encrypted task and contact apps, lightweight browser utilities, extensions, and desktop tools. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared auth SEO / social copy. */
export const AUTH_DESCRIPTION = `Passwordless entry for Helvety apps: OTP, passkeys, and session recovery where your platform allows. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shorter auth PWA install line; must match `public/manifest.json`. */
export const AUTH_PWA_MANIFEST_DESCRIPTION = `Passwordless Helvety sign-in: OTP and passkeys for encrypted apps. ${HELVETY_SWISS_BUILT_SUFFIX}`;

/** Shared store SEO / social copy. */
export const STORE_DESCRIPTION = `Browse free Helvety apps and downloads. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared contacts SEO / social copy. */
export const CONTACTS_APP_DESCRIPTION = `Encrypted contacts with names, numbers, birthdays, and notes. Personal, Work, and Other groups. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared notes SEO / social copy. */
export const NOTES_APP_DESCRIPTION = `Encrypted notes with titles and rich text in Personal, Work, and Other groups. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared tasks SEO / social copy. */
export const TASKS_APP_DESCRIPTION = `Stage-based tasks encrypted before they leave your browser. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Store products listing metadata. */
export const STORE_PRODUCTS_PAGE_DESCRIPTION = `Browse free Helvety products and apps. ${HELVETY_SWISS_ORIGIN_SEO}`;
