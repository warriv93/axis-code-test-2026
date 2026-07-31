import { graphql, type GraphQLSchema } from "graphql";
import {
  createInMemoryStore,
  type Store,
} from "../repositories/inMemoryStore.js";
import { seed } from "../domain/seed.js";
import { createAppSchema } from "./schema.js";
import type { GraphQLContext } from "./context.js";
import type { UserId } from "../domain/types.js";

export interface TestHarness {
  schema: GraphQLSchema;
  store: Store;
  /** Runs an operation against the real schema. No resolver is mocked. */
  run: (
    source: string,
    options?: { as?: UserId; variables?: Record<string, unknown> },
  ) => Promise<{
    data?: unknown;
    errors?: readonly { message: string; extensions?: unknown }[];
  }>;
}

/** Builds a server with its own isolated store for a single test. */
export function createTestHarness(): TestHarness {
  const store = createInMemoryStore(seed());
  const schema = createAppSchema();

  return {
    schema,
    store,
    run: async (source, options = {}) => {
      const contextValue: GraphQLContext = { store, userId: options.as };
      const result = await graphql({
        schema,
        source,
        contextValue,
        variableValues: options.variables,
      });
      return result as {
        data?: unknown;
        errors?: readonly { message: string }[];
      };
    },
  };
}

/** Pulls the `code` out of a GraphQL error's extensions. */
export function errorCode(
  error: { extensions?: unknown } | undefined,
): string | undefined {
  const extensions = error?.extensions as { code?: string } | undefined;
  return extensions?.code;
}
