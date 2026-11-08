import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Explicit Save: navigation goes through the unsaved-changes guards, and
  // only the save module writes tool data (see the design doc, §4 and §7).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next/link", message: "Use GuardedLink so unsaved changes are protected." },
            {
              name: "next/navigation",
              importNames: ["useRouter"],
              message: "Use useGuardedRouter so unsaved changes are protected.",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        { property: "setItem", message: "Write tool data through saveEntries (design doc §7)." },
        { property: "removeItem", message: "Write tool data through saveEntries (design doc §7)." },
      ],
    },
  },
  {
    files: ["src/components/GuardedLink.tsx", "src/hooks/useGuardedRouter.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // The save module, test helpers, and the two non-tool writers from §7.
    files: [
      "src/lib/persistence/save.ts",
      "src/lib/persistence/testing/**",
      "src/**/*.test.ts",
      "src/hooks/useTheme.ts",
      "src/components/ManualSaveNotice.tsx",
    ],
    rules: { "no-restricted-properties": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"]),
]);
