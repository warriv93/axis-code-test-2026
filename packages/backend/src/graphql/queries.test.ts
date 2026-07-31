import { describe, it, expect } from "vitest";
import { printSchema } from "graphql";
import { createTestHarness } from "./testHelpers.js";

describe("queries", () => {
  describe("cameras", () => {
    it("returns the whole fleet", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ cameras { id name address } }`);
      expect(result.errors).toBeUndefined();
      expect((result.data as { cameras: unknown[] }).cameras).toHaveLength(7);
    });

    it("exposes niceName as null when unset rather than failing", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ cameras { id niceName } }`);
      const cameras = (
        result.data as { cameras: { id: string; niceName: string | null }[] }
      ).cameras;
      expect(cameras.find((c) => c.id === "0")?.niceName).toBeNull();
      expect(cameras.find((c) => c.id === "1")?.niceName).toBe("My Device");
    });

    it("exposes an image url for every camera", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ cameras { imageUrl } }`);
      const cameras = (
        result.data as { cameras: { imageUrl: string | null }[] }
      ).cameras;
      expect(cameras.every((c) => typeof c.imageUrl === "string")).toBe(true);
    });

    it("resolves the users a camera is assigned to", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ cameras { id users { username } } }`);
      const cameras = (
        result.data as {
          cameras: { id: string; users: { username: string }[] }[];
        }
      ).cameras;
      expect(
        cameras.find((c) => c.id === "0")?.users.map((u) => u.username),
      ).toEqual(["alice"]);
      // camera 3 is assigned to nobody in the seed
      expect(cameras.find((c) => c.id === "3")?.users).toEqual([]);
    });
  });

  describe("users", () => {
    it("lists the users that can sign in", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ users { id username displayName } }`);
      const users = (result.data as { users: { username: string }[] }).users;
      expect(users.map((u) => u.username)).toEqual(["alice", "bob", "carol"]);
    });

    it("resolves the cameras assigned to a user", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ users { username cameras { id } } }`);
      const users = (
        result.data as {
          users: { username: string; cameras: { id: string }[] }[];
        }
      ).users;
      expect(
        users.find((u) => u.username === "alice")?.cameras.map((c) => c.id),
      ).toEqual(["0", "1", "2"]);
      expect(users.find((u) => u.username === "carol")?.cameras).toEqual([]);
    });
  });

  describe("me", () => {
    it("is null when the request carries no identity", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ me { username } }`);
      // Absence of a session is not an error — the login screen relies on this.
      expect(result.errors).toBeUndefined();
      expect((result.data as { me: unknown }).me).toBeNull();
    });

    it("resolves the signed-in user", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ me { username displayName } }`, {
        as: "bob",
      });
      expect(
        (result.data as { me: { username: string; displayName: string } }).me,
      ).toEqual({
        username: "bob",
        displayName: "Bob Nyström",
      });
    });

    it("resolves only that user's cameras", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ me { cameras { id } } }`, { as: "bob" });
      expect(
        (result.data as { me: { cameras: { id: string }[] } }).me.cameras.map(
          (c) => c.id,
        ),
      ).toEqual(["4", "5"]);
    });

    it("is null when the identity does not match a known user", async () => {
      const { run } = createTestHarness();
      const result = await run(`{ me { username } }`, { as: "ghost" });
      expect((result.data as { me: unknown }).me).toBeNull();
    });
  });

  describe("addCamera (provided mutation, must keep working)", () => {
    it("still adds a camera to the fleet", async () => {
      const { run } = createTestHarness();
      const result = await run(
        `mutation { addCamera(name: "P3268-LVE", address: "192.168.1.200") { id name niceName } }`,
      );
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        addCamera: { id: "7", name: "P3268-LVE", niceName: null },
      });

      const after = await run(`{ cameras { id } }`);
      expect((after.data as { cameras: unknown[] }).cameras).toHaveLength(8);
    });
  });
});

describe("schema contract", () => {
  it("matches the agreed SDL", async () => {
    const { schema } = createTestHarness();
    // Guards the public API: an accidental schema change fails here loudly.
    expect(printSchema(schema)).toMatchSnapshot();
  });
});
