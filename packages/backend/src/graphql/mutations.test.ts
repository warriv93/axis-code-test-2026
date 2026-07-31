import { describe, it, expect } from "vitest";
import { createTestHarness, errorCode } from "./testHelpers.js";

describe("login", () => {
  it("returns a token and the user", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { login(username: "alice") { token user { username displayName } } }`,
    );
    expect(result.errors).toBeUndefined();
    const payload = (
      result.data as { login: { token: string; user: { username: string } } }
    ).login;
    expect(payload.token).toEqual(expect.any(String));
    expect(payload.token.length).toBeGreaterThan(16);
    expect(payload.user.username).toBe("alice");
  });

  it("issues a token that authenticates subsequent requests", async () => {
    const { run, tokens } = createTestHarness();
    const login = await run(`mutation { login(username: "bob") { token } }`);
    const token = (login.data as { login: { token: string } }).login.token;

    // Resolve the token the way the HTTP layer would, then use that identity.
    const userId = tokens.resolve(token);
    const me = await run(`{ me { username } }`, { as: userId });
    expect((me.data as { me: { username: string } }).me.username).toBe("bob");
  });

  it("rejects an unknown username with UNAUTHENTICATED", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { login(username: "mallory") { token } }`,
    );
    expect(result.errors).toBeDefined();
    expect(errorCode(result.errors?.[0])).toBe("UNAUTHENTICATED");
  });

  it("does not reveal whether the username exists", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { login(username: "mallory") { token } }`,
    );
    expect(result.errors?.[0]?.message).not.toContain("mallory");
  });
});

describe("assignCameraToUser", () => {
  it("assigns a camera and returns the updated user", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { assignCameraToUser(userId: "carol", cameraId: "3") { username cameras { id } } }`,
      { as: "carol" },
    );
    expect(result.errors).toBeUndefined();
    expect(
      (result.data as { assignCameraToUser: { cameras: { id: string }[] } })
        .assignCameraToUser.cameras,
    ).toEqual([{ id: "3" }]);
  });

  it("is idempotent", async () => {
    const { run } = createTestHarness();
    const mutation = `mutation { assignCameraToUser(userId: "carol", cameraId: "3") { cameras { id } } }`;
    await run(mutation, { as: "carol" });
    const second = await run(mutation, { as: "carol" });
    expect(
      (second.data as { assignCameraToUser: { cameras: unknown[] } })
        .assignCameraToUser.cameras,
    ).toHaveLength(1);
  });

  it("lets a camera be shared by several users", async () => {
    const { run } = createTestHarness();
    // camera 0 already belongs to alice
    await run(
      `mutation { assignCameraToUser(userId: "carol", cameraId: "0") { id } }`,
      {
        as: "carol",
      },
    );
    const result = await run(`{ cameras { id users { username } } }`);
    const camera = (
      result.data as {
        cameras: { id: string; users: { username: string }[] }[];
      }
    ).cameras.find((c) => c.id === "0");
    expect(camera?.users.map((u) => u.username).sort()).toEqual([
      "alice",
      "carol",
    ]);
  });

  it("rejects an unknown camera with NOT_FOUND", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { assignCameraToUser(userId: "carol", cameraId: "999") { id } }`,
      { as: "carol" },
    );
    expect(errorCode(result.errors?.[0])).toBe("NOT_FOUND");
  });

  it("rejects an unknown user with NOT_FOUND", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { assignCameraToUser(userId: "ghost", cameraId: "3") { id } }`,
      { as: "ghost" },
    );
    expect(errorCode(result.errors?.[0])).toBe("NOT_FOUND");
  });

  it("rejects an anonymous request with UNAUTHENTICATED", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { assignCameraToUser(userId: "carol", cameraId: "3") { id } }`,
    );
    expect(errorCode(result.errors?.[0])).toBe("UNAUTHENTICATED");
  });

  it("forbids acting on another user's assignments", async () => {
    const { run, store } = createTestHarness();
    const result = await run(
      `mutation { assignCameraToUser(userId: "carol", cameraId: "3") { id } }`,
      { as: "bob" },
    );
    expect(errorCode(result.errors?.[0])).toBe("FORBIDDEN");
    // and nothing changed
    expect(store.assignments.isAssigned("carol", "3")).toBe(false);
  });
});

describe("unassignCameraFromUser", () => {
  it("removes the assignment and returns the updated user", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { unassignCameraFromUser(userId: "alice", cameraId: "0") { cameras { id } } }`,
      { as: "alice" },
    );
    expect(result.errors).toBeUndefined();
    expect(
      (
        result.data as { unassignCameraFromUser: { cameras: { id: string }[] } }
      ).unassignCameraFromUser.cameras.map((c) => c.id),
    ).toEqual(["1", "2"]);
  });

  it("never deletes the camera itself", async () => {
    const { run } = createTestHarness();
    await run(
      `mutation { unassignCameraFromUser(userId: "alice", cameraId: "0") { id } }`,
      { as: "alice" },
    );
    const fleet = await run(`{ cameras { id } }`);
    expect((fleet.data as { cameras: unknown[] }).cameras).toHaveLength(7);
  });

  it("is idempotent — unassigning something not assigned is a no-op", async () => {
    const { run } = createTestHarness();
    const result = await run(
      `mutation { unassignCameraFromUser(userId: "carol", cameraId: "3") { cameras { id } } }`,
      { as: "carol" },
    );
    expect(result.errors).toBeUndefined();
    expect(
      (result.data as { unassignCameraFromUser: { cameras: unknown[] } })
        .unassignCameraFromUser.cameras,
    ).toEqual([]);
  });

  it("forbids acting on another user's assignments", async () => {
    const { run, store } = createTestHarness();
    const result = await run(
      `mutation { unassignCameraFromUser(userId: "alice", cameraId: "0") { id } }`,
      { as: "bob" },
    );
    expect(errorCode(result.errors?.[0])).toBe("FORBIDDEN");
    expect(store.assignments.isAssigned("alice", "0")).toBe(true);
  });
});
