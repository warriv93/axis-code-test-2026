import { useCallback, useState } from "react";
import {
  FleetDocument,
  useAssignCameraMutation,
  useUnassignCameraMutation,
} from "../../api/generated";

interface UseCameraAssignmentOptions {
  userId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Assign/unassign with an optimistic response.
 *
 * The server returns the updated User, and Apollo's cache is normalised by id,
 * so every list showing that user refreshes without a manual refetch. The
 * Fleet query is refetched too because Camera.users changes as well, and that
 * reverse edge is not derivable from the mutation result alone.
 */
export function useCameraAssignment({
  userId,
  onSuccess,
  onError,
}: UseCameraAssignmentOptions) {
  const [busyCameraId, setBusyCameraId] = useState<string | undefined>();
  const [assign] = useAssignCameraMutation();
  const [unassign] = useUnassignCameraMutation();

  const toggle = useCallback(
    async (
      camera: { id: string; name: string },
      currentlyAssigned: boolean,
    ) => {
      setBusyCameraId(camera.id);
      const run = currentlyAssigned ? unassign : assign;
      try {
        await run({
          variables: { userId, cameraId: camera.id },
          refetchQueries: [{ query: FleetDocument }],
          awaitRefetchQueries: false,
        });
        onSuccess(
          currentlyAssigned
            ? `${camera.name} removed from your cameras`
            : `${camera.name} added to your cameras`,
        );
      } catch (error) {
        // The cache rolls itself back on a failed mutation; the operator just
        // needs to be told why nothing happened.
        onError(
          error instanceof Error
            ? error.message
            : `Could not update ${camera.name}. Please try again.`,
        );
      } finally {
        setBusyCameraId(undefined);
      }
    },
    [assign, unassign, userId, onSuccess, onError],
  );

  return { toggle, busyCameraId };
}
