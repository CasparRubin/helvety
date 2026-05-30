import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const devDepsNodeModules = path.resolve(configDir, "../dev-deps/node_modules");

/** import-x resolver settings: TypeScript project + dev-deps hoisted toolchain. */
const importResolverSettings = {
  "import-x/resolver": {
    typescript: {
      project: "./tsconfig.json",
    },
    node: {
      paths: [devDepsNodeModules],
    },
  },
};

/** Import ordering rules shared between app and package configs. */
const importRules = {
  "import-x/order": [
    "error",
    {
      groups: [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index",
        "type",
      ],
      pathGroups: [
        {
          pattern: "@/**",
          group: "internal",
          position: "after",
        },
      ],
      pathGroupsExcludedImportTypes: ["type"],
      "newlines-between": "always",
      alphabetize: {
        order: "asc",
        caseInsensitive: true,
      },
    },
  ],
  "import-x/no-unresolved": "error",
  "import-x/no-duplicates": "error",
};

/** TypeScript rules shared between app and package configs. */
const typescriptRules = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      checksVoidReturn: {
        attributes: false,
      },
    },
  ],
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/prefer-nullish-coalescing": "warn",
  "@typescript-eslint/prefer-optional-chain": "warn",
  "@typescript-eslint/no-unnecessary-type-assertion": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/ban-ts-comment": [
    "warn",
    {
      "ts-check": false,
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-expect-error": "allow-with-description",
      minimumDescriptionLength: 3,
    },
  ],
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
    },
  ],
  "@typescript-eslint/naming-convention": [
    "error",
    {
      selector: "default",
      format: ["camelCase"],
      leadingUnderscore: "allow",
      trailingUnderscore: "allow",
    },
    {
      selector: "variable",
      format: ["camelCase", "UPPER_CASE", "PascalCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: "parameter",
      format: ["camelCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: "function",
      format: ["camelCase", "PascalCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: "memberLike",
      modifiers: ["private"],
      format: ["camelCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: "typeLike",
      format: ["PascalCase"],
    },
    {
      selector: "interface",
      format: ["PascalCase"],
      custom: {
        regex: "^I[A-Z]",
        match: false,
      },
    },
    {
      selector: "typeParameter",
      format: ["PascalCase"],
    },
    {
      selector: "enumMember",
      format: ["PascalCase", "UPPER_CASE"],
    },
    {
      selector: "objectLiteralProperty",
      format: null,
    },
    {
      selector: "typeProperty",
      format: null,
    },
    {
      selector: "method",
      format: ["camelCase", "PascalCase", "UPPER_CASE"],
    },
    {
      selector: "import",
      format: ["camelCase", "PascalCase", "UPPER_CASE"],
    },
  ],
};

/** Code quality rules shared between app and package configs. */
const codeQualityRules = {
  "prefer-const": "error",
  "no-var": "error",
  "object-shorthand": "error",
  "prefer-arrow-callback": "error",
  "prefer-template": "warn",
  "no-console": ["warn", { allow: ["warn", "error"] }],
};

/** Import boundary rules for application workspaces. */
const appBoundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@helvety/auth",
            "@helvety/auth/*",
            "@helvety/contacts",
            "@helvety/contacts/*",
            "@helvety/image-upscaler",
            "@helvety/image-upscaler/*",
            "@helvety/links",
            "@helvety/links/*",
            "@helvety/notes",
            "@helvety/notes/*",
            "@helvety/pdf",
            "@helvety/pdf/*",
            "@helvety/store",
            "@helvety/store/*",
            "@helvety/tasks",
            "@helvety/tasks/*",
            "@helvety/web",
            "@helvety/web/*",
          ],
          message:
            "Do not import code directly from other apps. Promote shared code through @helvety/shared or @helvety/ui.",
        },
        {
          group: ["../../apps/**", "../../../apps/**", "../../../../apps/**"],
          message:
            "Cross-app relative imports are not allowed. Extract shared modules into packages.",
        },
      ],
    },
  ],
};

/** JSDoc rules shared between app and package configs. */
const jsdocRules = {
  "jsdoc/require-jsdoc": [
    "warn",
    {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: false,
        ClassDeclaration: true,
      },
      contexts: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
      checkConstructors: false,
    },
  ],
  "jsdoc/require-param": "off",
  "jsdoc/require-returns": "off",
  "jsdoc/require-param-type": "off",
  "jsdoc/require-returns-type": "off",
  "jsdoc/check-param-names": "off",
  "jsdoc/check-tag-names": "warn",
};

/**
 * Creates the shared Helvety ESLint configuration for Next.js apps.
 *
 * @param {string} rootDir - The root directory of the app (use `import.meta.dirname`).
 * @returns {import("eslint").Linter.Config[]} The ESLint config array.
 */
export function createEslintConfig(rootDir) {
  return defineConfig([
    ...nextVitals,
    ...nextTs,
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDir,
        },
      },
      plugins: {
        "import-x": importPlugin,
        jsdoc,
      },
      settings: importResolverSettings,
      rules: {
        // eslint-plugin-react-hooks 7.x (via eslint-config-next) flags patterns that
        // are still valid pre–React Compiler (e.g. baseline refs in derived memos).
        // Revisit when migrating those call sites.
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/refs": "off",
        "react-hooks/exhaustive-deps": "warn",
        "react/no-unescaped-entities": "error",
        "react/jsx-key": "error",
        "react/no-array-index-key": "warn",
        ...importRules,
        ...typescriptRules,
        ...codeQualityRules,
        ...appBoundaryRules,
        ...jsdocRules,
      },
    },
    // Dense UI modules (link pickers) and PDF worker/pipeline files export many
    // small functions without JSDoc; require-jsdoc would add noise. Keep the
    // exception list in one place and add globs here instead of per-file disables.
    // Vitest mocks and Next font metadata tests use PascalCase object literal
    // methods and third-party-shaped keys; keep naming rules on production code.
    {
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.test.mts",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/*.spec.mts",
      ],
      rules: {
        "@typescript-eslint/naming-convention": "off",
      },
    },
    {
      files: [
        "**/note-link-actions.ts",
        "**/task-link-actions.ts",
        "**/use-contact-links.ts",
        "**/use-note-links.ts",
        "**/use-task-links.ts",
        "**/note-links-panel.tsx",
        "**/task-links-panel.tsx",
        "**/pdf-conversion.ts",
        "**/pdf-processing-pipeline.ts",
        "**/pdf-processing-telemetry.ts",
        "**/pdf-processing-worker-types.ts",
        "**/pdf-processing.worker.ts",
        "**/image-upscaler-command-bar.test.tsx",
        "**/upscale-pipeline.test.ts",
        "**/onnx-inference.ts",
        "**/upscale-pipeline.ts",
        "**/upscale.worker.ts",
        "**/upscale-worker-client.ts",
        "**/upscale-worker-types.ts",
        "**/canvas-export-limits.ts",
        "**/helvety-image-upscaler.tsx",
      ],
      rules: {
        "jsdoc/require-jsdoc": "off",
      },
    },
    // Vendored React Bits / WebGL (apps/web/components/vendor): upstream style, not Helvety conventions.
    {
      files: ["**/components/vendor/**"],
      rules: {
        "jsdoc/require-jsdoc": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/consistent-type-imports": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/prefer-optional-chain": "off",
        "@typescript-eslint/prefer-nullish-coalescing": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "prefer-template": "off",
        "import-x/order": "off",
        "import-x/no-duplicates": "off",
      },
    },
    globalIgnores([
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
    ]),
    eslintConfigPrettier,
  ]);
}

/**
 * Creates the Helvety ESLint configuration for internal packages (no Next.js rules).
 *
 * @param {string} rootDir - The root directory of the package (use `import.meta.dirname`).
 * @returns {import("eslint").Linter.Config[]} The ESLint config array.
 */
export function createPackageEslintConfig(rootDir) {
  return defineConfig([
    ...tseslint.configs.recommended,
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDir,
        },
      },
      plugins: {
        "import-x": importPlugin,
        jsdoc,
      },
      settings: importResolverSettings,
      rules: {
        ...importRules,
        ...typescriptRules,
        ...codeQualityRules,
        ...jsdocRules,
      },
    },
    {
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.test.mts",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/*.spec.mts",
      ],
      rules: {
        "@typescript-eslint/naming-convention": "off",
      },
    },
    globalIgnores(["node_modules/**", "coverage/**"]),
    eslintConfigPrettier,
  ]);
}

/** Self-lint for this package when running `eslint --config eslint.mjs .` */
export default createPackageEslintConfig(import.meta.dirname);
