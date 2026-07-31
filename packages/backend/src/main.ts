import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { createAppSchema } from "./graphql/schema.js";
import { createInMemoryStore } from "./repositories/inMemoryStore.js";
import { seed } from "./domain/seed.js";
import type { GraphQLContext } from "./graphql/context.js";

/**
 * Composition root: the only place that picks concrete implementations.
 * Everything downstream depends on interfaces, which is what makes the
 * store swappable for a database without touching a resolver.
 */
const store = createInMemoryStore(seed());

const yoga = createYoga({
  schema: createAppSchema(),
  context: (): GraphQLContext => ({ store }),
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000/graphql");
});
