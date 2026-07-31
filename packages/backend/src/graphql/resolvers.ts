import type { Camera, User } from "../domain/types.js";
import type { GraphQLContext } from "./context.js";

/**
 * Resolvers are deliberately thin: they translate GraphQL arguments into
 * repository calls and back. Rules that matter live in the domain and
 * repository layers, where they are testable without a GraphQL document.
 */
export const resolvers = {
  Query: {
    cameras: (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ): Camera[] => ctx.store.cameras.all(),

    users: (_parent: unknown, _args: unknown, ctx: GraphQLContext): User[] =>
      ctx.store.users.all(),

    // Anonymous requests get null, not an error: the sign-in screen asks this
    // question precisely because it does not yet know the answer.
    me: (_parent: unknown, _args: unknown, ctx: GraphQLContext): User | null =>
      (ctx.userId ? ctx.store.users.byId(ctx.userId) : undefined) ?? null,
  },

  Mutation: {
    addCamera: (
      _parent: unknown,
      args: { name: string; niceName?: string | null; address: string },
      ctx: GraphQLContext,
    ): Camera =>
      ctx.store.cameras.add({
        name: args.name,
        address: args.address,
        ...(args.niceName ? { niceName: args.niceName } : {}),
      }),
  },

  User: {
    cameras: (parent: User, _args: unknown, ctx: GraphQLContext): Camera[] =>
      ctx.store.assignments
        .cameraIdsForUser(parent.id)
        .map((id) => ctx.store.cameras.byId(id))
        .filter((camera): camera is Camera => camera !== undefined),
  },

  Camera: {
    users: (parent: Camera, _args: unknown, ctx: GraphQLContext): User[] =>
      ctx.store.assignments
        .userIdsForCamera(parent.id)
        .map((id) => ctx.store.users.byId(id))
        .filter((user): user is User => user !== undefined),
  },
};
