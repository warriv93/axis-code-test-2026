import type { ReactElement, ReactNode } from "react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { render, type RenderResult } from "@testing-library/react";

/**
 * Renders a component inside the two providers it genuinely needs.
 * Apollo is mocked at the network layer, so components, hooks and the cache
 * all run for real — only the HTTP call is replaced.
 */
export function renderWithProviders(
  ui: ReactElement,
  mocks: readonly MockedResponse[] = [],
): RenderResult {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>
      <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
    </MockedProvider>
  );

  return render(ui, { wrapper: Wrapper });
}
