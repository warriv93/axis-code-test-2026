import { createSchema } from "graphql-yoga";
import { typeDefs } from "./typeDefs.js";
import { resolvers } from "./resolvers.js";
import type { GraphQLContext } from "./context.js";

/**
 * The executable schema. It holds no state — everything a resolver needs
 * arrives through GraphQLContext, which is what lets a test run the real
 * schema against its own isolated store.
 */
export function createAppSchema() {
  return createSchema<GraphQLContext>({
    typeDefs,
    resolvers,
  });
}
