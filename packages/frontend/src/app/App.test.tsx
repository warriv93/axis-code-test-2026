import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import {
  meMock,
  meSignedOutMock,
  usersMock,
  fleetMock,
  CAM_A,
} from "../test/fixtures";
import { AppShell } from "./App";

describe("AppShell", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows the sign-in screen when nobody is signed in", async () => {
    renderWithProviders(
      <AppShell themeMode="light" onToggleTheme={vi.fn()} />,
      [meSignedOutMock(), usersMock()],
    );

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("shows the dashboard and the operator's name once signed in", async () => {
    renderWithProviders(
      <AppShell themeMode="light" onToggleTheme={vi.fn()} />,
      [
        meMock([CAM_A]),
        fleetMock([
          {
            camera: CAM_A,
            users: [{ id: "alice", displayName: "Alice Lindqvist" }],
          },
        ]),
      ],
    );

    expect(
      await screen.findByRole("heading", { name: "My cameras" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice Lindqvist")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  it("offers a theme toggle that reports the theme it will switch to", async () => {
    const onToggleTheme = vi.fn();
    renderWithProviders(
      <AppShell themeMode="light" onToggleTheme={onToggleTheme} />,
      [meSignedOutMock(), usersMock()],
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );
    expect(onToggleTheme).toHaveBeenCalledOnce();
  });
});
