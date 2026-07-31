import type { UserId } from "../domain/types.js";
import type { Store } from "../repositories/inMemoryStore.js";
import type { GraphQLContext } from "../graphql/context.js";
import type { TokenStore } from "./tokenStore.js";

const BEARER = /^bearer\s+(.+)$/i;

/**
 * Decodes the Authorization header into a proven identity.
 *
 * A malformed, missing or unknown token is not an error here — it simply means
 * "anonymous". Resolvers decide whether anonymity is acceptable for the field
 * being asked for, which keeps `me` nullable while mutations stay guarded.
 */
export function userIdFromAuthorizationHeader(
  header: string | undefined | null,
  tokens: TokenStore,
): UserId | undefined {
  const match = header?.match(BEARER);
  const token = match?.[1];
  return token ? tokens.resolve(token) : undefined;
}

/** Builds the per-request context handed to every resolver. */
export function buildContext(
  request: Request,
  deps: { store: Store; tokens: TokenStore },
): GraphQLContext {
  return {
    store: deps.store,
    tokens: deps.tokens,
    userId: userIdFromAuthorizationHeader(
      request.headers.get("authorization"),
      deps.tokens,
    ),
  };
}
