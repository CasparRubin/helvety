import { createPackageEslintConfig } from "@helvety/config/eslint";

export default [
  ...createPackageEslintConfig(import.meta.dirname),
  { ignores: ["src/types/database.types.ts"] },
];
