import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { tokenStorage } from "../auth/tokenStorage";

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql";

/**
 * Attaches the bearer token to every request. Reading from storage per
 * request (rather than closing over a value) means a sign-in or sign-out
 * takes effect immediately, with no client rebuild.
 */
const authLink = setContext((_operation, { headers }) => {
  const token = tokenStorage.read();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export function createApolloClient() {
  return new ApolloClient({
    link: from([authLink, new HttpLink({ uri: GRAPHQL_URL })]),
    cache: new InMemoryCache({
      typePolicies: {
        // Cameras and users are normalised by id, so a mutation that returns
        // an updated User automatically refreshes every list showing it.
        Camera: { keyFields: ["id"] },
        User: {
          keyFields: ["id"],
          fields: {
            // An assignment change returns the user's complete camera list, so
            // replacing is correct. Saying so explicitly silences Apollo's
            // "cache data may be lost" warning, which would otherwise be a
            // real signal sitting in the console being ignored.
            cameras: { merge: false },
          },
        },
      },
    }),
  });
}
