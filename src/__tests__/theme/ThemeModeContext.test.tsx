import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeModeProvider, useThemeMode } from "@/theme/ThemeModeContext";

vi.mock("@/theme/theme", () => ({
  getStoredThemeMode: () => "light",
  setStoredThemeMode: vi.fn(),
  getTheme: (mode: string) => ({ palette: { mode } }),
}));

function TestConsumer() {
  const { mode, toggleMode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={toggleMode}>
        Toggle
      </button>
    </div>
  );
}

describe("ThemeModeContext", () => {
  afterEach(() => vi.restoreAllMocks());

  it("useThemeMode throws when used outside provider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useThemeMode must be used within ThemeModeProvider",
    );
  });

  it("provides mode and toggleMode and toggle updates mode", () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });
});
