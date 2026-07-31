import {
  Badge,
  Button,
  Caption1,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  AddRegular,
  ChevronRightRegular,
  SubtractRegular,
  VideoRegular,
} from "@fluentui/react-icons";
import type { CameraFieldsFragment } from "../../api/generated";

const useStyles = makeStyles({
  card: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow("hidden"),
    boxShadow: tokens.shadow4,
    transitionProperty: "box-shadow, transform, border-color",
    transitionDuration: tokens.durationNormal,
    // The hover cue points at the region that is actually clickable, so it
    // never competes with the assign/remove button below it.
    ":has(button[data-open]:hover), :has(button[data-open]:focus-visible)": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: tokens.shadow16,
      transform: "translateY(-2px)",
    },
  },
  // Griffel has no `all: unset`, so the button reset is explicit.
  open: {
    display: "block",
    width: "100%",
    cursor: "pointer",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    ...shorthands.borderStyle("none"),
    ...shorthands.padding(0),
    ...shorthands.margin(0),
    ":focus-visible": {
      ...shorthands.outline("2px", "solid", tokens.colorStrokeFocus2),
      outlineOffset: "-2px",
    },
    // Griffel cannot express a parent selector ("parent:hover &"), so every
    // hover cue is declared here, on the button, and reaches its children.
    ":hover [data-thumb]": { backgroundColor: tokens.colorBrandBackground2 },
    ":focus-visible [data-thumb]": {
      backgroundColor: tokens.colorBrandBackground2,
    },
    ":hover [data-thumb] img": { transform: "scale(1.04)" },
    ":focus-visible [data-thumb] img": { transform: "scale(1.04)" },
    ":hover [data-peek]": { opacity: 1, transform: "none" },
    ":focus-visible [data-peek]": { opacity: 1, transform: "none" },
    ":hover [data-name]": { color: tokens.colorBrandForegroundLink },
    ":focus-visible [data-name]": { color: tokens.colorBrandForegroundLink },
  },
  thumb: {
    position: "relative",
    aspectRatio: "4 / 3",
    display: "grid",
    placeItems: "center",
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    transitionProperty: "background-color",
    transitionDuration: tokens.durationNormal,
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transitionProperty: "transform",
    transitionDuration: tokens.durationNormal,
  },
  fallback: { fontSize: "40px", color: tokens.colorNeutralForeground4 },
  peek: {
    position: "absolute",
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    opacity: 0,
    transform: "translateY(-4px)",
    transitionProperty: "opacity, transform",
    transitionDuration: tokens.durationNormal,
    pointerEvents: "none",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  titles: { display: "flex", flexDirection: "column" },
  name: {
    fontWeight: tokens.fontWeightSemibold,
  },
  muted: { color: tokens.colorNeutralForeground3 },
  unset: { color: tokens.colorNeutralForeground4, fontStyle: "italic" },
  address: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
  },
});

export interface CameraCardProps {
  camera: CameraFieldsFragment;
  /** "assigned" shows Remove; "fleet" shows Add. */
  mode: "assigned" | "fleet";
  busy?: boolean;
  onOpen: (cameraId: string) => void;
  onToggleAssignment: (camera: CameraFieldsFragment) => void;
}

export function CameraCard({
  camera,
  mode,
  busy,
  onOpen,
  onToggleAssignment,
}: CameraCardProps) {
  const styles = useStyles();
  const assigned = mode === "assigned";

  return (
    <div className={styles.card}>
      <button
        type="button"
        data-open={camera.id}
        className={styles.open}
        onClick={() => onOpen(camera.id)}
        aria-label={`View details for ${camera.name}`}
      >
        <div className={styles.thumb} data-thumb="">
          {camera.imageUrl ? (
            <img
              className={styles.image}
              src={camera.imageUrl}
              alt={`Axis ${camera.name}`}
            />
          ) : (
            // A camera without a photo degrades to an icon, never a broken image.
            <VideoRegular className={styles.fallback} aria-hidden="true" />
          )}
          <Badge
            data-peek=""
            className={styles.peek}
            appearance="filled"
            color="brand"
            icon={<ChevronRightRegular />}
            iconPosition="after"
          >
            Details
          </Badge>
        </div>

        <div className={styles.body}>
          <div className={styles.titles}>
            <Text data-name="" className={styles.name}>
              {camera.name}
            </Text>
            {camera.niceName ? (
              <Caption1 className={styles.muted}>{camera.niceName}</Caption1>
            ) : (
              <Caption1 className={styles.unset}>No nice name set</Caption1>
            )}
          </div>
          <Caption1 className={styles.address}>{camera.address}</Caption1>
        </div>
      </button>

      <div className={styles.actions}>
        <Button
          appearance={assigned ? "secondary" : "primary"}
          icon={assigned ? <SubtractRegular /> : <AddRegular />}
          onClick={() => onToggleAssignment(camera)}
          disabled={busy}
          style={{ width: "100%" }}
        >
          {assigned ? "Remove" : "Add camera"}
        </Button>
      </div>
    </div>
  );
}
