import {
  Avatar,
  Badge,
  Button,
  Caption1,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  AddRegular,
  DismissRegular,
  SubtractRegular,
  VideoRegular,
} from "@fluentui/react-icons";
import type { FleetQuery } from "../../api/generated";

type FleetCamera = FleetQuery["cameras"][number];

const useStyles = makeStyles({
  hero: {
    aspectRatio: "4 / 3",
    display: "grid",
    placeItems: "center",
    padding: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  image: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
  fallback: { fontSize: "56px", color: tokens.colorNeutralForeground4 },
  body: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXL,
  },
  defs: {
    display: "grid",
    gridTemplateColumns: "104px 1fr",
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalS,
    margin: 0,
  },
  dt: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  dd: {
    margin: 0,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  mono: { fontFamily: tokens.fontFamilyMonospace },
  subhead: {
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
  people: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
  },
  person: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
  },
});

interface CameraDetailDrawerProps {
  camera: FleetCamera | undefined;
  currentUserId: string;
  busy?: boolean;
  onDismiss: () => void;
  onToggleAssignment: (camera: FleetCamera) => void;
}

export function CameraDetailDrawer({
  camera,
  currentUserId,
  busy,
  onDismiss,
  onToggleAssignment,
}: CameraDetailDrawerProps) {
  const styles = useStyles();
  if (!camera) return null;

  const assigned = camera.users.some((u) => u.id === currentUserId);

  return (
    <Drawer
      type="overlay"
      position="end"
      open
      onOpenChange={onDismiss}
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onDismiss}
              aria-label="Close details"
            />
          }
        >
          {camera.name}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        <div className={styles.hero}>
          {camera.imageUrl ? (
            <img
              className={styles.image}
              src={camera.imageUrl}
              alt={`Axis ${camera.name}`}
            />
          ) : (
            <VideoRegular className={styles.fallback} aria-hidden="true" />
          )}
        </div>

        {/* Native dl/dt/dd: Fluent's Text components only polymorph into
            inline/heading elements, and the semantics matter more here. */}
        <dl className={styles.defs}>
          <dt className={styles.dt}>Model</dt>
          <dd className={styles.dd}>{camera.name}</dd>

          <dt className={styles.dt}>Nice name</dt>
          <dd className={styles.dd}>{camera.niceName ?? "Not set"}</dd>

          <dt className={styles.dt}>IP address</dt>
          <dd className={mergeClasses(styles.dd, styles.mono)}>
            {camera.address}
          </dd>
        </dl>

        <div>
          <Caption1 as="p" className={styles.subhead}>
            Assigned to ({camera.users.length})
          </Caption1>
          <div className={styles.people}>
            {camera.users.length === 0 ? (
              <Caption1 className={styles.dt}>
                Not assigned to anyone yet.
              </Caption1>
            ) : (
              camera.users.map((user) => (
                <div key={user.id} className={styles.person}>
                  <Avatar name={user.displayName} size={24} color="colorful" />
                  <Text>{user.displayName}</Text>
                  {user.id === currentUserId && (
                    <Badge appearance="tint" color="brand">
                      You
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button
          appearance={assigned ? "secondary" : "primary"}
          icon={assigned ? <SubtractRegular /> : <AddRegular />}
          onClick={() => onToggleAssignment(camera)}
          disabled={busy}
          style={{ width: "100%" }}
        >
          {assigned ? "Remove" : "Add camera"}
        </Button>
      </DrawerFooter>
    </Drawer>
  );
}
