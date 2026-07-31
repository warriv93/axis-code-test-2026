import { ApolloProvider } from "@apollo/client";
import {
  FluentProvider,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { createApolloClient } from "../api/client";
import { useSession } from "../auth/useSession";
import { LoginScreen } from "../features/auth/LoginScreen";
import { Dashboard } from "../features/cameras/Dashboard";
import { AppHeader } from "./AppHeader";
import { useThemePreference, type ThemeMode } from "./useThemePreference";

const client = createApolloClient();

const useStyles = makeStyles({
  root: { minHeight: "100vh", backgroundColor: tokens.colorNeutralBackground2 },
  centre: {
    display: "grid",
    placeItems: "center",
    minHeight: "calc(100vh - 56px)",
  },
});

interface AppShellProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

/**
 * Chooses between the sign-in screen and the dashboard. Split out from App so
 * it can be rendered in tests with a mocked Apollo provider.
 *
 * The theme is owned by App and passed in: FluentProvider sits above this
 * component, so a second useThemePreference here would toggle a state the
 * provider never sees.
 */
export function AppShell({ themeMode, onToggleTheme }: AppShellProps) {
  const styles = useStyles();
  const { user, loading, signIn, signOut } = useSession();

  return (
    <div className={styles.root}>
      <AppHeader
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        user={user ?? undefined}
        onSignOut={user ? signOut : undefined}
      />
      {loading ? (
        <div className={styles.centre}>
          <Spinner label="Checking your session…" />
        </div>
      ) : user ? (
        <Dashboard user={user} />
      ) : (
        <LoginScreen onSignIn={signIn} />
      )}
    </div>
  );
}

export function App() {
  const { mode, theme, toggle } = useThemePreference();

  return (
    <ApolloProvider client={client}>
      <FluentProvider theme={theme}>
        <AppShell themeMode={mode} onToggleTheme={toggle} />
      </FluentProvider>
    </ApolloProvider>
  );
}
