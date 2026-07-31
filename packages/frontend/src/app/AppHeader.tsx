import {
  Avatar,
  Button,
  Subtitle2,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons";
import type { ThemeMode } from "./useThemePreference";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM,
    height: "56px",
    paddingInline: tokens.spacingHorizontalXXL,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
  },
  brand: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
  },
  wordmark: {
    fontWeight: tokens.fontWeightBold,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontSize: tokens.fontSizeBase300,
  },
  divider: {
    width: "1px",
    height: "24px",
    backgroundColor: tokens.colorNeutralStroke1,
  },
  spacer: { flexGrow: 1 },
  user: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
  },
  identity: { display: "flex", flexDirection: "column", lineHeight: 1.2 },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  role: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface AppHeaderProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  user?: { displayName: string; username: string } | undefined;
  onSignOut?: (() => void) | undefined;
}

export function AppHeader({
  themeMode,
  onToggleTheme,
  user,
  onSignOut,
}: AppHeaderProps) {
  const styles = useStyles();
  const nextTheme = themeMode === "light" ? "dark" : "light";

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Axis wordmark: the yellow triangle from their identity. */}
        <svg
          width="22"
          height="19"
          viewBox="0 0 22 19"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M11 0 22 19H0z" fill="#ffcc00" />
        </svg>
        <span className={styles.wordmark}>Axis</span>
      </div>
      <div className={styles.divider} role="presentation" />
      <Subtitle2>Camera Manager</Subtitle2>

      <div className={styles.spacer} />

      <Tooltip content={`Switch to ${nextTheme} theme`} relationship="label">
        <Button
          appearance="subtle"
          icon={
            themeMode === "light" ? (
              <WeatherMoonRegular />
            ) : (
              <WeatherSunnyRegular />
            )
          }
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} theme`}
        />
      </Tooltip>

      {user && (
        <div className={styles.user}>
          <Avatar name={user.displayName} size={32} color="colorful" />
          <div className={styles.identity}>
            <span className={styles.name}>{user.displayName}</span>
            <span className={styles.role}>{user.username}</span>
          </div>
          {onSignOut && (
            <Button appearance="subtle" onClick={onSignOut}>
              Sign out
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
