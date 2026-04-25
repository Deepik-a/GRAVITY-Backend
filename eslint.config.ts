//eslint source file

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";


export default tseslint.config(
  { ignores: ["dist/", "**/dist/**", "dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      globals: {
        ...globals.node,
         ...globals.commonjs,
        ...globals.es2021,
      },
       sourceType: "script" // CommonJS
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off", // Turned off in favor of @typescript-eslint/no-unused-vars
           // CommonJS allow
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
  }
);
