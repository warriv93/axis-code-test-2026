/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly rather than drifting to another port: the backend's CORS
    // allowlist and the e2e test both assume 5173.
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    // jsdom only provides localStorage on a real origin; without this the
    // default opaque origin leaves window.localStorage undefined.
    environmentOptions: {
      jsdom: { url: "http://localhost:5173" },
    },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
