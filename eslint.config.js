import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

export default ts.config(
  {
    ignores: ["dist/**", ".svelte-kit/**", "node_modules/**"]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    rules: {
      "quotes": ["error", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "warn",
      "no-useless-assignment": "off",
      "svelte/infinite-reactive-loop": "warn",
      "svelte/require-each-key": "off",
      "svelte/prefer-svelte-reactivity": "warn"
    }
  }
);
