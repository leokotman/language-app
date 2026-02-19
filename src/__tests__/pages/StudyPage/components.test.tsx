import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SignInAlert } from "@/pages/StudyPage/components/SignInAlert";
import { StudyLoading } from "@/pages/StudyPage/components/StudyLoading";
import { NoCardsDue } from "@/pages/StudyPage/components/NoCardsDue";
import { SessionComplete } from "@/pages/StudyPage/components/SessionComplete";
import { AnswerFeedbackBlock } from "@/pages/StudyPage/components/AnswerFeedbackBlock";

describe("SignInAlert", () => {
  it("renders Study heading and sign-in message", () => {
    render(<SignInAlert />);
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to study your vocabulary."),
    ).toBeInTheDocument();
  });
});

describe("StudyLoading", () => {
  it("renders loading spinner", () => {
    const { container } = render(<StudyLoading />);
    expect(
      container.querySelector(".MuiCircularProgress-root"),
    ).toBeInTheDocument();
  });
});

describe("NoCardsDue", () => {
  it("renders message when no pair options", () => {
    render(
      <NoCardsDue
        pairOptions={[]}
        selectedPairKey=""
        onPairChange={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(screen.getByText(/No cards due today/)).toBeInTheDocument();
  });

  it("renders language pair select when pairOptions provided", () => {
    const onPairChange = vi.fn();
    render(
      <NoCardsDue
        pairOptions={[{ key: "en-ru", label: "English ↔ Russian" }]}
        selectedPairKey="en-ru"
        onPairChange={onPairChange}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("English ↔ Russian")).toBeInTheDocument();
  });
});

describe("SessionComplete", () => {
  it("renders session complete message and back button", () => {
    const onBack = vi.fn();
    render(<SessionComplete cardCount={5} onBack={onBack} />);
    expect(screen.getByTestId("study-session-complete")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Session complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/You reviewed all 5 cards/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to study" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);
}

describe("AnswerFeedbackBlock", () => {
  it("renders Correct when correct is true", () => {
    renderWithTheme(
      <AnswerFeedbackBlock
        correct
        correctAnswer="привет"
        ratingButtons={<button type="button">Rate</button>}
      />,
    );
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.queryByText(/Wrong/)).not.toBeInTheDocument();
  });

  it("renders Wrong without correct answer when userAnswer is undefined", () => {
    renderWithTheme(
      <AnswerFeedbackBlock
        correct={false}
        correctAnswer="привет"
        ratingButtons={<button type="button">Rate</button>}
      />,
    );
    expect(screen.getByText(/Wrong/)).toBeInTheDocument();
    expect(screen.queryByText("Correct: привет")).not.toBeInTheDocument();
  });

  it("renders Wrong with correct answer when userAnswer is provided", () => {
    renderWithTheme(
      <AnswerFeedbackBlock
        correct={false}
        userAnswer="привт"
        correctAnswer="привет"
        ratingButtons={<button type="button">Rate</button>}
      />,
    );
    expect(screen.getByText(/Wrong/)).toBeInTheDocument();
    expect(screen.getByText("Correct: привет")).toBeInTheDocument();
  });
});
