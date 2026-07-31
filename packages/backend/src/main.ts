import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { createAppSchema } from "./graphql/schema.js";
import { createInMemoryStore } from "./repositories/inMemoryStore.js";
import { seed } from "./domain/seed.js";
import { createTokenStore } from "./auth/tokenStore.js";
import { buildContext } from "./auth/buildContext.js";

/**
 * Composition root: the only place that picks concrete implementations.
 * Everything downstream depends on interfaces, which is what makes the
 * store swappable for a database without touching a resolver.
 */
const store = createInMemoryStore(seed());
const tokens = createTokenStore();

const yoga = createYoga({
  schema: createAppSchema(),
  context: ({ request }) => buildContext(request, { store, tokens }),
  cors: {
    origin: ["http://localhost:5173", "http://localhost:4173"],
    credentials: true,
  },
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000/graphql");
});
