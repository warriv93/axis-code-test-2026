import { printSchema } from "graphql";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createAppSchema } from "../graphql/schema.js";

/**
 * Writes the SDL to schema.graphql so the frontend's codegen has a single
 * source of truth without needing the server running (which matters in CI).
 * Run with: npm run schema -w backend
 */
const out = fileURLToPath(new URL("../../schema.graphql", import.meta.url));
writeFileSync(out, printSchema(createAppSchema()));
console.info(`Wrote ${out}`);
