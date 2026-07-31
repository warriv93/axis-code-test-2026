import type { SeedData } from "../domain/seed.js";
import type {
  Camera,
  CameraId,
  NewCamera,
  User,
  UserId,
} from "../domain/types.js";
import type {
  AssignmentRepository,
  CameraRepository,
  UserRepository,
} from "./types.js";

export interface Store {
  cameras: CameraRepository;
  users: UserRepository;
  assignments: AssignmentRepository;
}

/** Encodes a link as a single map key, which makes assignment naturally idempotent. */
const key = (userId: UserId, cameraId: CameraId) => `${userId}::${cameraId}`;

/**
 * In-memory implementation of the three repositories.
 *
 * Built from seed data passed in rather than imported, so every test — and the
 * server itself — owns its own isolated store. Nothing here is shared state.
 */
export function createInMemoryStore(data: SeedData): Store {
  const cameras: Camera[] = [...data.cameras];
  const users: User[] = [...data.users];
  const links = new Set<string>(
    data.assignments.map((a) => key(a.userId, a.cameraId)),
  );

  /** Monotonic, so ids stay unique even if a camera is ever removed. */
  let nextCameraId = cameras.length;

  const cameraRepository: CameraRepository = {
    all: () => [...cameras],
    byId: (id) => cameras.find((c) => c.id === id),
    add: (camera: NewCamera) => {
      const created: Camera = { id: String(nextCameraId++), ...camera };
      cameras.push(created);
      return created;
    },
  };

  const userRepository: UserRepository = {
    all: () => [...users],
    byId: (id) => users.find((u) => u.id === id),
    byUsername: (username) => users.find((u) => u.username === username),
  };

  const assignmentRepository: AssignmentRepository = {
    cameraIdsForUser: (userId) =>
      cameras
        .map((c) => c.id)
        .filter((cameraId) => links.has(key(userId, cameraId))),
    userIdsForCamera: (cameraId) =>
      users
        .map((u) => u.id)
        .filter((userId) => links.has(key(userId, cameraId))),
    isAssigned: (userId, cameraId) => links.has(key(userId, cameraId)),
    assign: (userId, cameraId) => {
      links.add(key(userId, cameraId));
    },
    unassign: (userId, cameraId) => {
      links.delete(key(userId, cameraId));
    },
  };

  return {
    cameras: cameraRepository,
    users: userRepository,
    assignments: assignmentRepository,
  };
}
