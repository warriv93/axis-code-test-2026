import { describe, it, expect } from "vitest";
import { createTokenStore } from "./tokenStore.js";
import { userIdFromAuthorizationHeader } from "./buildContext.js";

describe("token store", () => {
  it("issues a token that resolves back to the user", () => {
    const tokens = createTokenStore();
    const token = tokens.issue("alice");
    expect(tokens.resolve(token)).toBe("alice");
  });

  it("issues a different token per call", () => {
    const tokens = createTokenStore();
    expect(tokens.issue("alice")).not.toBe(tokens.issue("alice"));
  });

  it("does not leak the user id into the token", () => {
    const tokens = createTokenStore();
    // A token that is just the username would let anyone impersonate anyone.
    expect(tokens.issue("alice")).not.toContain("alice");
  });

  it("returns undefined for an unknown token", () => {
    const tokens = createTokenStore();
    expect(tokens.resolve("not-a-real-token")).toBeUndefined();
  });
});

describe("authorization header parsing", () => {
  const tokens = createTokenStore();
  const token = tokens.issue("bob");

  it("reads a bearer token", () => {
    expect(userIdFromAuthorizationHeader(`Bearer ${token}`, tokens)).toBe(
      "bob",
    );
  });

  it("accepts the scheme case-insensitively", () => {
    expect(userIdFromAuthorizationHeader(`bearer ${token}`, tokens)).toBe(
      "bob",
    );
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["no scheme", "sometoken"],
    ["wrong scheme", "Basic sometoken"],
    ["unknown token", "Bearer nope"],
  ])("yields no identity when the header is %s", (_label, header) => {
    expect(userIdFromAuthorizationHeader(header, tokens)).toBeUndefined();
  });
});
