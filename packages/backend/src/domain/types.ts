/**
 * The domain vocabulary. Pure data — no I/O, no framework, no GraphQL.
 *
 * A Camera exists in the fleet independently of any User. The link between the
 * two is an Assignment, which is many-to-many: a camera can be watched by
 * several operators, and removing it from one operator does not delete it.
 */

export type CameraId = string;
export type UserId = string;

export interface Camera {
  id: CameraId;
  name: string;
  /** Operator-chosen label. Optional — the seed leaves one unset on purpose. */
  niceName?: string;
  address: string;
  /** Path to the product photo served by the frontend. */
  imageUrl?: string;
}

export interface User {
  id: UserId;
  username: string;
  displayName: string;
}

/** The fields a caller supplies when creating a camera; the id is assigned by the store. */
export type NewCamera = Omit<Camera, "id">;

/** A User↔Camera link. */
export interface Assignment {
  userId: UserId;
  cameraId: CameraId;
}
