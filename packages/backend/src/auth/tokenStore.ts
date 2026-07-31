import { randomUUID } from "node:crypto";
import type { UserId } from "../domain/types.js";

/**
 * Maps opaque bearer tokens to user ids.
 *
 * Deliberately not a JWT and deliberately not derived from the username: the
 * token carries no information, so it cannot be forged by guessing. It lives in
 * memory, so restarting the server signs everyone out — acceptable for a demo,
 * and the seam to replace with real sessions is this interface.
 */
export interface TokenStore {
  issue(userId: UserId): string;
  resolve(token: string): UserId | undefined;
}

export function createTokenStore(): TokenStore {
  const tokens = new Map<string, UserId>();

  return {
    issue: (userId) => {
      const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
      tokens.set(token, userId);
      return token;
    },
    resolve: (token) => tokens.get(token),
  };
}
