import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore minified third-party files
    "public/pdf.worker.min.mjs",
  ]),
  {
    rules: {
      // Allow unused variables/parameters prefixed with underscore
      // This is a common pattern for intentionally unused parameters
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Code quality rules - warn level for gradual adoption
      // Encourage explicit return types for better type safety and documentation
      // Note: Other rules like prefer-readonly, prefer-nullish-coalescing, and
      // prefer-optional-chain require type-aware linting which isn't configured
      // in the current Next.js ESLint setup. These patterns are still encouraged
      // in code reviews and can be enabled if type-aware linting is configured.
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
