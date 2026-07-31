import { GraphQLError } from "graphql";

/**
 * The error vocabulary the API commits to. Clients branch on
 * `extensions.code`, never on the message text.
 */
export const errors = {
  unauthenticated: (message = "You must be signed in to do that.") =>
    new GraphQLError(message, { extensions: { code: "UNAUTHENTICATED" } }),

  forbidden: (message = "You can only manage your own cameras.") =>
    new GraphQLError(message, { extensions: { code: "FORBIDDEN" } }),

  notFound: (what: string) =>
    new GraphQLError(`${what} not found.`, {
      extensions: { code: "NOT_FOUND" },
    }),
};
