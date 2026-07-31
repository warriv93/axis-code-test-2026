import type { Assignment, Camera, User } from "./types.js";

export interface SeedData {
  cameras: Camera[];
  users: User[];
  assignments: Assignment[];
}

/**
 * Demo fleet: the two cameras supplied with the starter plus five more real
 * Axis models. Returns a fresh deep copy on every call so tests are isolated.
 *
 * Camera "0" deliberately has no niceName — it keeps the nullable field
 * exercised end to end, and gives the UI a case to degrade gracefully on.
 */
export function seed(): SeedData {
  const cameras: Camera[] = [
    {
      id: "0",
      name: "A8207-VE MKII",
      address: "192.168.1.101",
      imageUrl: "/camera-images/a8207-ve-mkii.webp",
    },
    {
      id: "1",
      name: "I8307-VE",
      niceName: "My Device",
      address: "192.168.1.102",
      imageUrl: "/camera-images/i8307-ve.webp",
    },
    {
      id: "2",
      name: "P3265-LVE",
      niceName: "Lobby Dome",
      address: "192.168.1.103",
      imageUrl: "/camera-images/p3265-lve.webp",
    },
    {
      id: "3",
      name: "M2036-LE",
      niceName: "Parking Bullet",
      address: "192.168.1.104",
      imageUrl: "/camera-images/m2036-le.webp",
    },
    {
      id: "4",
      name: "Q6135-LE",
      niceName: "Perimeter PTZ",
      address: "192.168.1.105",
      imageUrl: "/camera-images/q6135-le.webp",
    },
    {
      id: "5",
      name: "P1467-LE",
      niceName: "Loading Bay",
      address: "192.168.1.106",
      imageUrl: "/camera-images/p1467-le.webp",
    },
    {
      id: "6",
      name: "M3216-LVE",
      niceName: "Stairwell",
      address: "192.168.1.107",
      imageUrl: "/camera-images/m3216-lve.webp",
    },
  ];

  const users: User[] = [
    { id: "alice", username: "alice", displayName: "Alice Lindqvist" },
    { id: "bob", username: "bob", displayName: "Bob Nyström" },
    // Carol has no cameras on purpose: it keeps the empty state reachable.
    { id: "carol", username: "carol", displayName: "Carol Ek" },
  ];

  const assignments: Assignment[] = [
    { userId: "alice", cameraId: "0" },
    { userId: "alice", cameraId: "1" },
    { userId: "alice", cameraId: "2" },
    { userId: "bob", cameraId: "4" },
    { userId: "bob", cameraId: "5" },
  ];

  return { cameras, users, assignments };
}
