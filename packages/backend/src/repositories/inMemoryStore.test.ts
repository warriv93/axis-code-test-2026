import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryStore, type Store } from "./inMemoryStore.js";
import { seed } from "../domain/seed.js";

describe("in-memory store", () => {
  let store: Store;

  beforeEach(() => {
    // A fresh store per test: no test can leak state into another.
    store = createInMemoryStore(seed());
  });

  describe("seed data", () => {
    it("contains the two provided cameras plus five more", () => {
      expect(store.cameras.all()).toHaveLength(7);
    });

    it("keeps the provided cameras intact", () => {
      const names = store.cameras.all().map((c) => c.name);
      expect(names).toContain("A8207-VE MKII");
      expect(names).toContain("I8307-VE");
    });

    it("leaves niceName unset on the first camera so the nullable field is exercised", () => {
      const camera = store.cameras.byId("0");
      expect(camera?.niceName).toBeUndefined();
    });

    it("gives every camera an image", () => {
      expect(store.cameras.all().every((c) => Boolean(c.imageUrl))).toBe(true);
    });

    it("seeds three users, one of whom has no cameras", () => {
      const users = store.users.all();
      expect(users).toHaveLength(3);

      const carol = store.users.byUsername("carol");
      expect(carol).toBeDefined();
      expect(store.assignments.cameraIdsForUser(carol!.id)).toEqual([]);
    });
  });

  describe("lookups", () => {
    it("finds a user by username", () => {
      expect(store.users.byUsername("alice")?.displayName).toBe(
        "Alice Lindqvist",
      );
    });

    it("returns undefined for an unknown username", () => {
      expect(store.users.byUsername("nobody")).toBeUndefined();
    });

    it("returns undefined for an unknown camera id", () => {
      expect(store.cameras.byId("999")).toBeUndefined();
    });
  });

  describe("assignment", () => {
    it("assigns a camera to a user", () => {
      store.assignments.assign("carol", "0");
      expect(store.assignments.cameraIdsForUser("carol")).toEqual(["0"]);
    });

    it("is idempotent — assigning twice does not duplicate", () => {
      store.assignments.assign("carol", "0");
      store.assignments.assign("carol", "0");
      expect(store.assignments.cameraIdsForUser("carol")).toEqual(["0"]);
    });

    it("unassigns a camera", () => {
      store.assignments.assign("carol", "0");
      store.assignments.unassign("carol", "0");
      expect(store.assignments.cameraIdsForUser("carol")).toEqual([]);
    });

    it("is idempotent — unassigning something not assigned is a no-op", () => {
      expect(() => store.assignments.unassign("carol", "0")).not.toThrow();
      expect(store.assignments.cameraIdsForUser("carol")).toEqual([]);
    });

    it("never destroys the camera when unassigning", () => {
      store.assignments.assign("carol", "0");
      store.assignments.unassign("carol", "0");
      expect(store.cameras.byId("0")).toBeDefined();
    });

    it("supports many-to-many — one camera, several users", () => {
      store.assignments.assign("carol", "0");
      // camera 0 is already assigned to alice by the seed
      expect(store.assignments.userIdsForCamera("0").sort()).toEqual([
        "alice",
        "carol",
      ]);
    });

    it("reports whether a camera is assigned", () => {
      expect(store.assignments.isAssigned("alice", "0")).toBe(true);
      expect(store.assignments.isAssigned("carol", "0")).toBe(false);
    });
  });

  describe("adding a camera", () => {
    it("appends a camera with a fresh id and returns it", () => {
      const created = store.cameras.add({
        name: "P3268-LVE",
        address: "192.168.1.200",
      });
      expect(created.id).toBe("7");
      expect(store.cameras.all()).toHaveLength(8);
      expect(store.cameras.byId("7")).toEqual(created);
    });

    it("keeps ids unique after a camera is added", () => {
      store.cameras.add({ name: "X", address: "1.1.1.1" });
      store.cameras.add({ name: "Y", address: "1.1.1.2" });
      const ids = store.cameras.all().map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
