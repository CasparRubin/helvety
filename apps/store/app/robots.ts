import { createAppRobots } from "@helvety/shared/seo";

export default createAppRobots(
  ["/account", "/subscriptions", "/tenants", "/api", "/auth"],
  "/store/sitemap.xml"
);
