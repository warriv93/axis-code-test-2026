import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ALICE, CAM_A, CAM_B, CAM_C, fleetMock } from "../../test/fixtures";
import { Dashboard } from "./Dashboard";

const user = { ...ALICE, cameras: [CAM_A, CAM_B] };
const fleet = fleetMock([
  { camera: CAM_A, users: [{ id: "alice", displayName: "Alice Lindqvist" }] },
  { camera: CAM_B, users: [{ id: "alice", displayName: "Alice Lindqvist" }] },
  { camera: CAM_C, users: [{ id: "bob", displayName: "Bob Nyström" }] },
]);

describe("Dashboard", () => {
  it("shows the signed-in user's cameras", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);

    expect(await screen.findByText("A8207-VE MKII")).toBeInTheDocument();
    expect(screen.getByText("I8307-VE")).toBeInTheDocument();
  });

  it("separates unassigned fleet cameras from the user's own", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);

    // Q6135-LE belongs to bob, so it appears as available to add
    expect(
      await screen.findByRole("button", { name: /View details for Q6135-LE/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add camera" })).toHaveLength(
      1,
    );
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
  });

  it("labels a camera with no nice name instead of leaving it blank", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);
    expect(await screen.findByText("No nice name set")).toBeInTheDocument();
  });

  it("renders the product photo for each camera", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);
    const image = await screen.findByAltText("Axis A8207-VE MKII");
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("/camera-images/"),
    );
  });

  it("shows an explicit empty state when the user has no cameras", async () => {
    renderWithProviders(<Dashboard user={{ ...ALICE, cameras: [] }} />, [
      fleet,
    ]);
    expect(await screen.findByText("No cameras assigned")).toBeInTheDocument();
  });

  it("filters the fleet by IP address", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);
    await screen.findByRole("button", { name: /View details for Q6135-LE/ });

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Filter fleet cameras" }),
      "192.168.1.105",
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Add camera" }),
      ).toHaveLength(1);
    });
    expect(screen.getByText("Q6135-LE")).toBeInTheDocument();
  });

  it("explains when a filter matches nothing", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);
    await screen.findByRole("button", { name: /View details for Q6135-LE/ });

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Filter fleet cameras" }),
      "zzz",
    );

    expect(await screen.findByText(/No cameras match/)).toBeInTheDocument();
  });

  it("opens a detail drawer listing everyone the camera is assigned to", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);

    await userEvent.click(
      await screen.findByRole("button", { name: "View details for Q6135-LE" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Q6135-LE");
    expect(dialog).toHaveTextContent("Perimeter PTZ");
    expect(dialog).toHaveTextContent("192.168.1.105");
    expect(dialog).toHaveTextContent("Bob Nyström");
  });

  it("closes the drawer on Escape", async () => {
    renderWithProviders(<Dashboard user={user} />, [fleet]);
    await userEvent.click(
      await screen.findByRole("button", { name: "View details for Q6135-LE" }),
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
