import type { UserId } from "../domain/types.js";
import type { Store } from "../repositories/inMemoryStore.js";

/**
 * What every resolver is handed.
 *
 * `userId` is the identity proven by the request's bearer token, or undefined
 * for an anonymous request. Resolvers never read headers themselves — the
 * transport is decoded once, at the edge, in auth/buildContext.
 */
export interface GraphQLContext {
  store: Store;
  userId?: UserId;
}
