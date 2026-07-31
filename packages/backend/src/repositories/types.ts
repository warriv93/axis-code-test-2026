import type {
  Camera,
  CameraId,
  NewCamera,
  User,
  UserId,
} from "../domain/types.js";

/**
 * Storage seams. Resolvers depend on these interfaces, never on a concrete
 * implementation, so swapping the in-memory store for a database is a change
 * to the composition root only.
 */

export interface CameraRepository {
  all(): Camera[];
  byId(id: CameraId): Camera | undefined;
  add(camera: NewCamera): Camera;
}

export interface UserRepository {
  all(): User[];
  byId(id: UserId): User | undefined;
  byUsername(username: string): User | undefined;
}

export interface AssignmentRepository {
  cameraIdsForUser(userId: UserId): CameraId[];
  userIdsForCamera(cameraId: CameraId): UserId[];
  isAssigned(userId: UserId, cameraId: CameraId): boolean;
  /** Idempotent: assigning an already-assigned camera changes nothing. */
  assign(userId: UserId, cameraId: CameraId): void;
  /** Idempotent: unassigning an unassigned camera is a no-op, never an error. */
  unassign(userId: UserId, cameraId: CameraId): void;
}
