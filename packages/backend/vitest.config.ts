import { defineConfig } from "vitest/config";

export default defineConfig({
  // graphql ships both CJS and ESM entry points. Without this, the test file
  // and graphql-yoga can each end up with their own copy, and graphql's
  // instanceof checks then reject a schema built by "another realm".
  resolve: {
    dedupe: ["graphql"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    server: {
      deps: {
        inline: [/graphql/],
      },
    },
  },
});
