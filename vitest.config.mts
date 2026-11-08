import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pin the time zone so local-date tests give the same result on every machine
// and OS (an npm-script `TZ=` prefix does not work in Windows shells).
process.env.TZ = "Asia/Singapore";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: { TZ: "Asia/Singapore" },
  },
});
