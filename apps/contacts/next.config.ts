import { createE2eeZoneNextConfig } from "@helvety/config/next";

const nextConfig = createE2eeZoneNextConfig({
  appName: "contacts",
  extraOptimize: ["date-fns"],
});

export default nextConfig;
