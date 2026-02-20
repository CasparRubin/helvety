import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

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
  "import-x/no-unresolved": "off",
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
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
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
      settings: {
        "import-x/resolver": {
          typescript: {
            project: "./tsconfig.json",
          },
        },
      },
      rules: {
        "react-hooks/exhaustive-deps": "warn",
        "react/no-unescaped-entities": "error",
        "react/jsx-key": "error",
        "react/no-array-index-key": "warn",
        ...importRules,
        ...typescriptRules,
        ...codeQualityRules,
        ...jsdocRules,
      },
    },
    globalIgnores([
      ".next/**",
      "out/**",
      "build/**",
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
      settings: {
        "import-x/resolver": {
          typescript: {
            project: "./tsconfig.json",
          },
        },
      },
      rules: {
        ...importRules,
        ...typescriptRules,
        ...codeQualityRules,
        ...jsdocRules,
      },
    },
    globalIgnores(["node_modules/**"]),
    eslintConfigPrettier,
  ]);
}
