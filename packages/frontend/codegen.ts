import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * The schema is read from the SDL the backend emits (npm run schema -w backend)
 * rather than from a running server, so codegen works in CI and offline.
 * Regenerate with: npm run codegen -w frontend
 */
const config: CodegenConfig = {
  schema: "../backend/schema.graphql",
  documents: "src/**/*.graphql",
  generates: {
    "src/api/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        skipTypename: false,
        scalars: { ID: "string" },
      },
    },
  },
};

export default config;
