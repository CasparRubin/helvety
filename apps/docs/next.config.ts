import { createPublicToolNextConfig } from "@helvety/config/next";

export default createPublicToolNextConfig({
  appName: "docs",
  optimizePackageImports: ["lucide-react", "@eigenpal/docx-editor-react"],
});
