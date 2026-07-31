import { useCallback, useState } from "react";
import {
  FleetDocument,
  useAssignCameraMutation,
  useUnassignCameraMutation,
  type CameraFieldsFragment,
} from "../../api/generated";

interface UseCameraAssignmentOptions {
  userId: string;
  /** The user's current cameras — the basis for the optimistic result. */
  assignedCameras: CameraFieldsFragment[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Assign/unassign, applied optimistically.
 *
 * Both mutations return the updated User, so an optimistic response of the
 * same shape lets Apollo update its normalised cache immediately — the card
 * moves between sections before the request lands, and Apollo rolls the cache
 * back by itself if the mutation fails.
 *
 * The Fleet query is refetched as well: Camera.users also changes, and that
 * reverse edge is not derivable from the mutation result alone.
 */
export function useCameraAssignment({
  userId,
  assignedCameras,
  onSuccess,
  onError,
}: UseCameraAssignmentOptions) {
  const [busyCameraId, setBusyCameraId] = useState<string | undefined>();
  const [assign] = useAssignCameraMutation();
  const [unassign] = useUnassignCameraMutation();

  const toggle = useCallback(
    async (camera: CameraFieldsFragment, currentlyAssigned: boolean) => {
      setBusyCameraId(camera.id);

      const nextCameras = currentlyAssigned
        ? assignedCameras.filter((c) => c.id !== camera.id)
        : [...assignedCameras, camera];

      const optimisticUser = {
        __typename: "User" as const,
        id: userId,
        cameras: nextCameras,
      };

      try {
        if (currentlyAssigned) {
          await unassign({
            variables: { userId, cameraId: camera.id },
            optimisticResponse: { unassignCameraFromUser: optimisticUser },
            refetchQueries: [{ query: FleetDocument }],
          });
          onSuccess(`${camera.name} removed from your cameras`);
        } else {
          await assign({
            variables: { userId, cameraId: camera.id },
            optimisticResponse: { assignCameraToUser: optimisticUser },
            refetchQueries: [{ query: FleetDocument }],
          });
          onSuccess(`${camera.name} added to your cameras`);
        }
      } catch (error) {
        // Apollo has already rolled the optimistic write back; the operator
        // just needs to be told why the card jumped back.
        onError(
          error instanceof Error
            ? error.message
            : `Could not update ${camera.name}. Please try again.`,
        );
      } finally {
        setBusyCameraId(undefined);
      }
    },
    [assign, unassign, userId, assignedCameras, onSuccess, onError],
  );

  return { toggle, busyCameraId };
}
