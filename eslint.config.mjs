import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/travel/AddPlaceSheet.tsx"],
    rules: {
      /** Form reset when opening / switching edit target is intentional synchronous setup. */
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: [
      "src/components/map/maplibre-ui.tsx",
      "src/components/travel/TravelMapEffects.tsx",
    ],
    rules: {
      /** MapLibre / marker patterns use ref sync and mount effects like the upstream snippet. */
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
