import { useState } from "react";
import {
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useUsersQuery } from "../../api/generated";

const useStyles = makeStyles({
  wrap: {
    minHeight: "calc(100vh - 56px)",
    display: "grid",
    placeItems: "center",
    padding: tokens.spacingVerticalXXL,
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: tokens.spacingVerticalXXL,
    rowGap: tokens.spacingVerticalL,
  },
  head: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
  },
  sub: { color: tokens.colorNeutralForeground2 },
});

interface LoginScreenProps {
  onSignIn: (username: string) => Promise<void>;
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const styles = useStyles();
  const { data, loading, error } = useUsersQuery();
  const [selected, setSelected] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | undefined>();

  const users = data?.users ?? [];
  const chosen = selected ?? users[0]?.username;

  async function handleSignIn() {
    if (!chosen) return;
    setSubmitting(true);
    setFailure(undefined);
    try {
      await onSignIn(chosen);
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Sign-in failed. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <div className={styles.head}>
          <Title2 as="h1">Sign in</Title2>
          <Body1 className={styles.sub}>
            Choose an operator to view their assigned cameras.
          </Body1>
        </div>

        {error && (
          <MessageBar intent="error">
            <MessageBarBody>
              Could not reach the camera service. Check that the backend is
              running on port 4000, then reload.
            </MessageBarBody>
          </MessageBar>
        )}

        {failure && (
          <MessageBar intent="error">
            <MessageBarBody>{failure}</MessageBarBody>
          </MessageBar>
        )}

        {loading ? (
          <Spinner label="Loading operators…" />
        ) : (
          <Field label="Operator">
            <Dropdown
              aria-label="Operator"
              value={
                users.find((u) => u.username === chosen)?.displayName ?? ""
              }
              selectedOptions={chosen ? [chosen] : []}
              onOptionSelect={(
                _event: unknown,
                data: { optionValue?: string },
              ) => setSelected(data.optionValue)}
              disabled={users.length === 0}
            >
              {users.map((user) => (
                <Option
                  key={user.id}
                  value={user.username}
                  text={user.displayName}
                >
                  {user.displayName}
                </Option>
              ))}
            </Dropdown>
          </Field>
        )}

        <Button
          appearance="primary"
          onClick={handleSignIn}
          disabled={!chosen || submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </Card>
    </div>
  );
}
