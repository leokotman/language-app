import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignInAlert } from "@/pages/StudyPage/components/SignInAlert";
import { StudyLoading } from "@/pages/StudyPage/components/StudyLoading";
import { NoCardsDue } from "@/pages/StudyPage/components/NoCardsDue";
import { SessionComplete } from "@/pages/StudyPage/components/SessionComplete";

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
