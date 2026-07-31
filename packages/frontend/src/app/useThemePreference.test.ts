import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemePreference } from "./useThemePreference";

describe("useThemePreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to light when nothing is stored", () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.mode).toBe("light");
  });

  it("toggles between light and dark", () => {
    const { result } = renderHook(() => useThemePreference());
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("dark");
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("light");
  });

  it("remembers the choice across remounts", () => {
    const first = renderHook(() => useThemePreference());
    act(() => first.result.current.toggle());
    first.unmount();

    const second = renderHook(() => useThemePreference());
    expect(second.result.current.mode).toBe("dark");
  });

  it("exposes the matching Fluent theme", () => {
    const { result } = renderHook(() => useThemePreference());
    const light = result.current.theme;
    act(() => result.current.toggle());
    expect(result.current.theme).not.toBe(light);
  });
});
