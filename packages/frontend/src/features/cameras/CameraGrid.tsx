import {
  Caption1,
  Skeleton,
  SkeletonItem,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { VideoRegular } from "@fluentui/react-icons";
import { CameraCard, type CameraCardProps } from "./CameraCard";
import type { CameraFieldsFragment } from "../../api/generated";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  skeletonCard: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  skeletonThumb: { height: "150px" },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    textAlign: "center",
    padding: tokens.spacingVerticalXXXL,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border("1px", "dashed", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  emptyIcon: { fontSize: "32px", color: tokens.colorNeutralForeground4 },
  emptySub: { color: tokens.colorNeutralForeground3, maxWidth: "42ch" },
});

interface CameraGridProps
  extends Pick<CameraCardProps, "mode" | "onOpen" | "onToggleAssignment"> {
  cameras: CameraFieldsFragment[];
  loading: boolean;
  busyCameraId?: string | undefined;
  emptyTitle: string;
  emptyBody: string;
}

export function CameraGrid({
  cameras,
  loading,
  mode,
  busyCameraId,
  emptyTitle,
  emptyBody,
  onOpen,
  onToggleAssignment,
}: CameraGridProps) {
  const styles = useStyles();

  if (loading) {
    return (
      <div
        className={styles.grid}
        aria-busy="true"
        aria-label="Loading cameras"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={styles.skeletonCard}>
            <SkeletonItem className={styles.skeletonThumb} />
            <SkeletonItem size={16} />
            <SkeletonItem size={12} />
            <SkeletonItem size={32} />
          </Skeleton>
        ))}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className={styles.empty}>
        <VideoRegular className={styles.emptyIcon} aria-hidden="true" />
        <Text weight="semibold">{emptyTitle}</Text>
        <Caption1 className={styles.emptySub}>{emptyBody}</Caption1>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          mode={mode}
          busy={busyCameraId === camera.id}
          onOpen={onOpen}
          onToggleAssignment={onToggleAssignment}
        />
      ))}
    </div>
  );
}
