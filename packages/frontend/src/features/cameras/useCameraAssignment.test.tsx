import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { InMemoryCache } from "@apollo/client";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  AssignCameraDocument,
  MeDocument,
  UnassignCameraDocument,
} from "../../api/generated";
import { ALICE, CAM_A, CAM_B, CAM_C, fleetMock } from "../../test/fixtures";
import { useCameraAssignment } from "./useCameraAssignment";

/**
 * These tests exist because the optimistic path is the risky part of this hook:
 * if a rollback fails, the UI has told the operator they have a camera the
 * server just refused them. That is the one behaviour worth proving directly
 * rather than inferring from the end-to-end run.
 */

/** A cache configured exactly like the real one, pre-seeded with alice's session. */
function seededCache(cameras = [CAM_A, CAM_B]) {
  const cache = new InMemoryCache({
    typePolicies: {
      Camera: { keyFields: ["id"] },
      User: { keyFields: ["id"], fields: { cameras: { merge: false } } },
    },
  });
  cache.writeQuery({
    query: MeDocument,
    data: { me: { ...ALICE, cameras } },
  });
  return cache;
}

/**
 * The camera ids the UI would currently render under "My cameras".
 *
 * `optimistic: true` is essential, not incidental. readQuery defaults to
 * reading past the optimistic layer, which would make every assertion here
 * report the pre-mutation state — so a broken rollback would still look
 * correct and these tests would prove nothing. Components read through the
 * optimistic layer, so the tests must too.
 */
function assignedIds(cache: InMemoryCache): string[] {
  const data = cache.readQuery<{ me: { cameras: { id: string }[] } }>({
    query: MeDocument,
    optimistic: true,
  });
  return (data?.me.cameras ?? []).map((c) => c.id);
}

const fleet = fleetMock([
  { camera: CAM_A, users: [{ id: "alice", displayName: "Alice Lindqvist" }] },
  { camera: CAM_B, users: [{ id: "alice", displayName: "Alice Lindqvist" }] },
  { camera: CAM_C, users: [{ id: "bob", displayName: "Bob Nyström" }] },
]);

function renderAssignment(
  mocks: MockedResponse[],
  cache: InMemoryCache,
  assignedCameras = [CAM_A, CAM_B],
) {
  const onSuccess = vi.fn();
  const onError = vi.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} cache={cache}>
      {children}
    </MockedProvider>
  );

  const view = renderHook(
    () =>
      useCameraAssignment({
        userId: "alice",
        assignedCameras,
        onSuccess,
        onError,
      }),
    { wrapper },
  );

  return { ...view, onSuccess, onError };
}

const assignOk = (delay?: number): MockedResponse => ({
  request: {
    query: AssignCameraDocument,
    variables: { userId: "alice", cameraId: CAM_C.id },
  },
  result: {
    data: {
      assignCameraToUser: {
        __typename: "User",
        id: "alice",
        cameras: [CAM_A, CAM_B, CAM_C],
      },
    },
  },
  ...(delay === undefined ? {} : { delay }),
});

describe("useCameraAssignment", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("assigning a camera", () => {
    it("adds the camera and reports success by name", async () => {
      const cache = seededCache();
      const { result, onSuccess, onError } = renderAssignment(
        [assignOk(), fleet],
        cache,
      );

      await act(() => result.current.toggle(CAM_C, false));

      expect(assignedIds(cache)).toEqual(["0", "1", "4"]);
      expect(onSuccess).toHaveBeenCalledWith("Q6135-LE added to your cameras");
      expect(onError).not.toHaveBeenCalled();
    });

    it("applies the change optimistically, before the server has responded", async () => {
      const cache = seededCache();
      const { result } = renderAssignment([assignOk(300), fleet], cache);

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.toggle(CAM_C, false);
      });

      // A zero-delay tick cannot advance the mock's 300ms delay, so if the
      // cache has changed by now it can only be the optimistic write. Without
      // this the assertion would pass either way and prove nothing.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(assignedIds(cache)).toEqual(["0", "1", "4"]);

      await act(async () => {
        await pending;
      });
      expect(assignedIds(cache)).toEqual(["0", "1", "4"]);
    });
  });

  describe("unassigning a camera", () => {
    it("removes the camera and reports success by name", async () => {
      const cache = seededCache();
      const mock: MockedResponse = {
        request: {
          query: UnassignCameraDocument,
          variables: { userId: "alice", cameraId: CAM_B.id },
        },
        result: {
          data: {
            unassignCameraFromUser: {
              __typename: "User",
              id: "alice",
              cameras: [CAM_A],
            },
          },
        },
      };

      const { result, onSuccess } = renderAssignment([mock, fleet], cache);

      await act(() => result.current.toggle(CAM_B, true));

      expect(assignedIds(cache)).toEqual(["0"]);
      expect(onSuccess).toHaveBeenCalledWith(
        "I8307-VE removed from your cameras",
      );
    });
  });

  describe("when the mutation fails", () => {
    const rejected: MockedResponse = {
      request: {
        query: AssignCameraDocument,
        variables: { userId: "alice", cameraId: CAM_C.id },
      },
      error: new Error("You can only manage your own cameras."),
    };

    it("rolls the optimistic change back", async () => {
      const cache = seededCache();
      // Delayed so the optimistic layer is observable before the rejection
      // lands. Asserting only the end state would also pass if the optimistic
      // write had never been applied at all — this proves it was applied and
      // then reverted.
      const slowRejection: MockedResponse = { ...rejected, delay: 300 };
      const { result } = renderAssignment([slowRejection, fleet], cache);

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.toggle(CAM_C, false);
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(assignedIds(cache)).toEqual(["0", "1", "4"]); // applied…

      await act(async () => {
        await pending;
      });

      // …and reverted. The operator must not be left believing they have a
      // camera the server just refused them.
      expect(assignedIds(cache)).toEqual(["0", "1"]);
    });

    it("reports the failure instead of swallowing it", async () => {
      const cache = seededCache();
      const { result, onError, onSuccess } = renderAssignment(
        [rejected, fleet],
        cache,
      );

      await act(() => result.current.toggle(CAM_C, false));

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("You can only manage your own cameras"),
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears the busy flag, so the button does not stay disabled", async () => {
      const cache = seededCache();
      const { result } = renderAssignment([rejected, fleet], cache);

      await act(() => result.current.toggle(CAM_C, false));

      await waitFor(() => expect(result.current.busyCameraId).toBeUndefined());
    });
  });

  describe("busy state", () => {
    it("marks only the camera being changed as busy while in flight", async () => {
      const cache = seededCache();
      const { result } = renderAssignment([assignOk(300), fleet], cache);

      expect(result.current.busyCameraId).toBeUndefined();

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.toggle(CAM_C, false);
      });
      expect(result.current.busyCameraId).toBe(CAM_C.id);

      await act(async () => {
        await pending;
      });
      expect(result.current.busyCameraId).toBeUndefined();
    });
  });
});
