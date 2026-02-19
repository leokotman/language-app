import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SignInAlert } from "@/pages/StudyPage/components/SignInAlert";
import { StudyLoading } from "@/pages/StudyPage/components/StudyLoading";
import { NoCardsDue } from "@/pages/StudyPage/components/NoCardsDue";
import { SessionComplete } from "@/pages/StudyPage/components/SessionComplete";
import { AnswerFeedbackBlock } from "@/pages/StudyPage/components/AnswerFeedbackBlock";
import { MultipleChoiceBlock } from "@/pages/StudyPage/components/MultipleChoiceBlock";
import { TypingBlock } from "@/pages/StudyPage/components/TypingBlock";
import { RatingButtons } from "@/pages/StudyPage/components/RatingButtons";
import { FlashcardBlock } from "@/pages/StudyPage/components/FlashcardBlock";
import { ReverseFlashcardBlock } from "@/pages/StudyPage/components/ReverseFlashcardBlock";
import { ListeningBlock } from "@/pages/StudyPage/components/ListeningBlock";
import { SpeakingBlock } from "@/pages/StudyPage/components/SpeakingBlock";
import { ReverseMultipleChoiceBlock } from "@/pages/StudyPage/components/ReverseMultipleChoiceBlock";
import { StudySetup } from "@/pages/StudyPage/components/StudySetup";
import type { ExerciseType } from "@/pages/StudyPage/StudyPage.models";

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

  it("calls onPairChange when language pair selection changes", () => {
    const onPairChange = vi.fn();
    render(
      <NoCardsDue
        pairOptions={[
          { key: "en-ru", label: "English ↔ Russian" },
          { key: "en-sr", label: "English ↔ Serbian" },
        ]}
        selectedPairKey="en-ru"
        onPairChange={onPairChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "English ↔ Serbian" }));
    expect(onPairChange).toHaveBeenCalledWith("en-sr");
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

describe("MultipleChoiceBlock", () => {
  it("renders word and options and calls onSelect when option clicked", () => {
    const onSelect = vi.fn();
    render(
      <MultipleChoiceBlock
        word="hello"
        options={["привет", "пока", "да"]}
        answered={false}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "привет" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "привет" }));
    expect(onSelect).toHaveBeenCalledWith("привет");
  });

  it("disables buttons when answered is true", () => {
    render(
      <MultipleChoiceBlock
        word="hello"
        options={["привет"]}
        answered
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "привет" })).toBeDisabled();
  });
});

describe("TypingBlock", () => {
  it("renders word, input and check button and calls handlers", () => {
    const onChange = vi.fn();
    const onCheck = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <TypingBlock
        word="hello"
        value=""
        onChange={onChange}
        onCheck={onCheck}
        onKeyDown={onKeyDown}
      />,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    const input = screen.getByLabelText("Translation");
    fireEvent.change(input, { target: { value: "привет" } });
    expect(onChange).toHaveBeenCalledWith("привет");
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onCheck).toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onKeyDown).toHaveBeenCalled();
  });
});

describe("RatingButtons", () => {
  it("renders rating buttons and calls onRate", () => {
    const onRate = vi.fn();
    render(<RatingButtons onRate={onRate} isPending={false} />);
    expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Good" }));
    expect(onRate).toHaveBeenCalled();
  });
});

describe("FlashcardBlock", () => {
  it("renders word and reveal button when not revealed", () => {
    const onReveal = vi.fn();
    render(
      <FlashcardBlock
        word="hello"
        translation="привет"
        revealed={false}
        onReveal={onReveal}
      />,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reveal translation" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal translation" }));
    expect(onReveal).toHaveBeenCalled();
  });

  it("renders translation when revealed", () => {
    render(
      <FlashcardBlock
        word="hello"
        translation="привет"
        revealed
        onReveal={() => {}}
      />,
    );
    expect(screen.getByText("привет")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reveal translation" }),
    ).not.toBeInTheDocument();
  });
});

describe("ReverseFlashcardBlock", () => {
  it("renders translation prompt and reveal word button when not revealed", () => {
    const onReveal = vi.fn();
    render(
      <ReverseFlashcardBlock
        word="hello"
        translation="привет"
        revealed={false}
        onReveal={onReveal}
      />,
    );
    expect(screen.getByText("привет")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal word" }));
    expect(onReveal).toHaveBeenCalled();
  });

  it("renders word when revealed", () => {
    render(
      <ReverseFlashcardBlock
        word="hello"
        translation="привет"
        revealed
        onReveal={() => {}}
      />,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

describe("ListeningBlock", () => {
  it("renders play button and options and calls handlers", () => {
    const onPlayWord = vi.fn();
    const onSelect = vi.fn();
    render(
      <ListeningBlock
        onPlayWord={onPlayWord}
        options={["привет", "пока"]}
        answered={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play word" }));
    expect(onPlayWord).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "привет" }));
    expect(onSelect).toHaveBeenCalledWith("привет");
  });
});

describe("SpeakingBlock", () => {
  it("renders word and record button when not recording", () => {
    const onStartRecording = vi.fn();
    render(
      <SpeakingBlock
        word="hello"
        onPlayWord={() => {}}
        isRecording={false}
        recordingBlob={null}
        recordingError={null}
        onStartRecording={onStartRecording}
        onStopRecording={() => {}}
        onPlayBack={() => {}}
      />,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("study-speaking-record"));
    expect(onStartRecording).toHaveBeenCalled();
  });

  it("renders stop button when recording and play back when blob exists", () => {
    const onStopRecording = vi.fn();
    const onPlayBack = vi.fn();
    render(
      <SpeakingBlock
        word="hello"
        onPlayWord={() => {}}
        isRecording
        recordingBlob={new Blob()}
        recordingError={null}
        onStartRecording={() => {}}
        onStopRecording={onStopRecording}
        onPlayBack={onPlayBack}
      />,
    );
    fireEvent.click(screen.getByTestId("study-speaking-stop"));
    expect(onStopRecording).toHaveBeenCalled();
  });

  it("shows recording error when provided", () => {
    render(
      <SpeakingBlock
        word="hello"
        onPlayWord={() => {}}
        isRecording={false}
        recordingBlob={null}
        recordingError="Microphone access denied"
        onStartRecording={() => {}}
        onStopRecording={() => {}}
        onPlayBack={() => {}}
      />,
    );
    expect(screen.getByText("Microphone access denied")).toBeInTheDocument();
  });
});

describe("ReverseMultipleChoiceBlock", () => {
  it("renders translation and options and calls onSelect", () => {
    const onSelect = vi.fn();
    render(
      <ReverseMultipleChoiceBlock
        translation="привет"
        options={["hello", "bye"]}
        answered={false}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("привет")).toBeInTheDocument();
    expect(screen.getByText("Pick the correct word")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "hello" }));
    expect(onSelect).toHaveBeenCalledWith("hello");
  });
});

describe("StudySetup", () => {
  const pairOptions = [
    { key: "en-ru", label: "English ↔ Russian" },
    { key: "en-sr", label: "English ↔ Serbian" },
  ];
  const defaultProps = {
    pairOptions,
    selectedPairKey: "en-ru",
    onPairChange: vi.fn(),
    dueLoading: false,
    dueCount: 5,
    enabledExerciseTypes: ["flashcard" as ExerciseType],
    onToggleExerciseType: vi.fn(),
    canStart: true,
    onStartSession: vi.fn(),
  };

  it("renders Study heading and pair select when pairOptions provided", () => {
    render(<StudySetup {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("English ↔ Russian")).toBeInTheDocument();
  });

  it("calls onPairChange when pair selection changes", () => {
    render(<StudySetup {...defaultProps} />);
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "English ↔ Serbian" }));
    expect(defaultProps.onPairChange).toHaveBeenCalledWith("en-sr");
  });

  it("calls onStartSession when Start session clicked", () => {
    render(<StudySetup {...defaultProps} />);
    fireEvent.click(screen.getByTestId("study-start-session"));
    expect(defaultProps.onStartSession).toHaveBeenCalled();
  });

  it("shows loading when dueLoading and disables start when canStart false", () => {
    const { container } = render(
      <StudySetup {...defaultProps} dueLoading canStart={false} />,
    );
    expect(
      container.querySelector(".MuiCircularProgress-root"),
    ).toBeInTheDocument();
  });
});
