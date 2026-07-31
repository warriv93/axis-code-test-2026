import { useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { useLoginMutation, useMeQuery, type MeQuery } from "../api/generated";
import { tokenStorage } from "./tokenStorage";

export type SessionUser = NonNullable<MeQuery["me"]>;

export interface Session {
  user: SessionUser | null;
  loading: boolean;
  error: Error | undefined;
  signIn: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * The whole session in one place: who is signed in, and how that changes.
 *
 * `me` is the source of truth rather than the login response, so a stale or
 * revoked token resolves to signed-out on the next load instead of showing a
 * user the server no longer recognises.
 */
export function useSession(): Session {
  const client = useApolloClient();
  const { data, loading, error } = useMeQuery();
  const [login] = useLoginMutation();

  const signIn = useCallback(
    async (username: string) => {
      const result = await login({ variables: { username } });
      const token = result.data?.login.token;
      if (!token) throw new Error("Sign-in did not return a token.");

      tokenStorage.write(token);
      // Re-run every active query so they are re-sent with the new token.
      await client.resetStore();
    },
    [client, login],
  );

  const signOut = useCallback(async () => {
    tokenStorage.clear();
    await client.resetStore();
  }, [client]);

  return {
    user: data?.me ?? null,
    loading,
    error: error as Error | undefined,
    signIn,
    signOut,
  };
}
