import type { Camera, CameraId, User, UserId } from "../domain/types.js";
import type { GraphQLContext } from "./context.js";
import { errors } from "./errors.js";

/**
 * Guard shared by both assignment mutations.
 *
 * Order matters: authenticate, then authorize, then check existence. Checking
 * existence first would let an anonymous caller probe which ids are real.
 */
function authorizeAssignment(
  ctx: GraphQLContext,
  userId: UserId,
  cameraId: CameraId,
): { user: User } {
  if (!ctx.userId) throw errors.unauthenticated();
  if (ctx.userId !== userId) throw errors.forbidden();

  const user = ctx.store.users.byId(userId);
  if (!user) throw errors.notFound("User");
  if (!ctx.store.cameras.byId(cameraId)) throw errors.notFound("Camera");

  return { user };
}

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
    login: (
      _parent: unknown,
      args: { username: string },
      ctx: GraphQLContext,
    ): { token: string; user: User } => {
      const user = ctx.store.users.byUsername(args.username);
      // The message deliberately does not echo the username back, so this
      // cannot be used to enumerate which accounts exist.
      if (!user) throw errors.unauthenticated("Unknown username.");

      return { token: ctx.tokens.issue(user.id), user };
    },

    assignCameraToUser: (
      _parent: unknown,
      args: { userId: UserId; cameraId: CameraId },
      ctx: GraphQLContext,
    ): User => {
      const { user } = authorizeAssignment(ctx, args.userId, args.cameraId);
      ctx.store.assignments.assign(args.userId, args.cameraId);
      return user;
    },

    unassignCameraFromUser: (
      _parent: unknown,
      args: { userId: UserId; cameraId: CameraId },
      ctx: GraphQLContext,
    ): User => {
      const { user } = authorizeAssignment(ctx, args.userId, args.cameraId);
      ctx.store.assignments.unassign(args.userId, args.cameraId);
      return user;
    },

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
