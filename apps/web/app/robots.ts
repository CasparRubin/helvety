import {
  createOpenRobots,
  GATEWAY_DISALLOWED_PATHS,
} from "@helvety/shared/seo";

/** Canonical RFC 9309 robots.txt for helvety.com (gateway only). */
export default createOpenRobots("/sitemap-index.xml", GATEWAY_DISALLOWED_PATHS);
