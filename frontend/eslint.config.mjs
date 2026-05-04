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
    // Standalone utility script — not part of the Next.js app bundle:
    "upscaleFonts.js",
  ]),
  // Downgrade pervasive legacy patterns to warnings so real errors remain visible.
  {
    rules: {
      // The codebase uses `as any` for dynamic i18n/role lookups — warn, don't block.
      "@typescript-eslint/no-explicit-any": "warn",
      // localStorage → setState in useEffect is the intended hydration pattern here.
      "react-hooks/set-state-in-effect": "warn",
      // Missing fetchUsers dep is intentional (called imperatively, not reactively).
      "react-hooks/exhaustive-deps": "warn",
      // Unused vars in catch blocks are common try/catch placeholders.
      "@typescript-eslint/no-unused-vars": "warn",
      // upscaleFonts.js is a standalone CJS utility — not a Next.js module.
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
]);

export default eslintConfig;
