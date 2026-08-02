import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import sortImports from "eslint-plugin-simple-import-sort";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "simple-import-sort": sortImports,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      eqeqeq: ["error", "smart"],
      "no-throw-literal": "error",
      "no-return-assign": "error",
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
