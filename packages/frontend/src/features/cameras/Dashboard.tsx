import { useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Divider,
  MessageBar,
  MessageBarBody,
  SearchBox,
  Subtitle1,
  Subtitle2,
  Toast,
  ToastTitle,
  Toaster,
  makeStyles,
  tokens,
  useId,
  useToastController,
} from "@fluentui/react-components";
import { useFleetQuery, type CameraFieldsFragment } from "../../api/generated";
import type { SessionUser } from "../../auth/useSession";
import { CameraGrid } from "./CameraGrid";
import { CameraDetailDrawer } from "./CameraDetailDrawer";
import { useCameraAssignment } from "./useCameraAssignment";

const useStyles = makeStyles({
  page: {
    maxWidth: "1180px",
    marginInline: "auto",
    padding: tokens.spacingVerticalXXL,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXXL,
  },
  head: {
    display: "flex",
    alignItems: "baseline",
    columnGap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    marginBottom: tokens.spacingVerticalM,
  },
  sub: { flexBasis: "100%", color: tokens.colorNeutralForeground3 },
  search: { maxWidth: "320px", marginBottom: tokens.spacingVerticalL },
});

interface DashboardProps {
  user: SessionUser;
}

export function Dashboard({ user }: DashboardProps) {
  const styles = useStyles();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const { data, loading, error } = useFleetQuery();
  const [query, setQuery] = useState("");
  const [openCameraId, setOpenCameraId] = useState<string | undefined>();

  const notify = (message: string, intent: "success" | "error") =>
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent, position: "bottom-end" },
    );

  const { toggle, busyCameraId } = useCameraAssignment({
    userId: user.id,
    onSuccess: (m) => notify(m, "success"),
    onError: (m) => notify(m, "error"),
  });

  const fleet = useMemo(() => data?.cameras ?? [], [data]);
  const assignedIds = useMemo(
    () => new Set(user.cameras.map((c) => c.id)),
    [user.cameras],
  );

  const assigned = user.cameras;
  const available = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fleet
      .filter((camera) => !assignedIds.has(camera.id))
      .filter((camera) =>
        term.length === 0
          ? true
          : `${camera.name} ${camera.niceName ?? ""} ${camera.address}`
              .toLowerCase()
              .includes(term),
      );
  }, [fleet, assignedIds, query]);

  const openCamera = fleet.find((c) => c.id === openCameraId);

  const handleToggle = (camera: CameraFieldsFragment) =>
    toggle(camera, assignedIds.has(camera.id));

  return (
    <main className={styles.page}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            Could not load the camera fleet. Check that the backend is running
            on port 4000, then reload.
          </MessageBarBody>
        </MessageBar>
      )}

      <section>
        <div className={styles.head}>
          <Subtitle1 as="h1">My cameras</Subtitle1>
          <Badge appearance="tint" color="brand">
            {assigned.length}
          </Badge>
          <Body1 className={styles.sub}>Cameras assigned to you.</Body1>
        </div>
        <CameraGrid
          cameras={assigned}
          loading={loading && assigned.length === 0}
          mode="assigned"
          busyCameraId={busyCameraId}
          emptyTitle="No cameras assigned"
          emptyBody="You have no cameras yet. Add one from the fleet below."
          onOpen={setOpenCameraId}
          onToggleAssignment={handleToggle}
        />
      </section>

      <Divider />

      <section>
        <div className={styles.head}>
          <Subtitle2 as="h2">Available in fleet</Subtitle2>
          <Badge appearance="tint" color="brand">
            {available.length}
          </Badge>
          <Body1 className={styles.sub}>
            Cameras on the network that are not assigned to you.
          </Body1>
        </div>
        <SearchBox
          className={styles.search}
          placeholder="Filter by model, name or IP"
          aria-label="Filter fleet cameras"
          value={query}
          onChange={(_event: unknown, data: { value: string }) =>
            setQuery(data.value)
          }
        />
        <CameraGrid
          cameras={available}
          loading={loading}
          mode="fleet"
          busyCameraId={busyCameraId}
          emptyTitle={
            query ? `No cameras match “${query}”` : "Every camera is assigned"
          }
          emptyBody={
            query
              ? "Try a different model name, nice name or IP address."
              : "You already have every camera in the fleet."
          }
          onOpen={setOpenCameraId}
          onToggleAssignment={handleToggle}
        />
      </section>

      <CameraDetailDrawer
        camera={openCamera}
        currentUserId={user.id}
        busy={busyCameraId === openCamera?.id}
        onDismiss={() => setOpenCameraId(undefined)}
        onToggleAssignment={handleToggle}
      />

      <Toaster toasterId={toasterId} />
    </main>
  );
}
