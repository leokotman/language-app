import { useCallback, useMemo, useState } from "react";
import { Box, Typography, Card as MuiCard, CardContent } from "@mui/material";
import { useAuthStore } from "@/stores/authStore";
import { useUserLanguages } from "@/hooks/useUserLanguages";
import { useDueToday, useUpdateUserVocabulary } from "@/hooks/useVocabulary";
import { scheduleRating, StudyRating } from "@/lib/fsrs";
import { getBidirectionalKey } from "@/types";
import { BIDIRECTIONAL_PAIRS, VIRTUAL_PAIR_RU_SR } from "@/types";
import type {
  StudyCardItem,
  StudySessionState,
  ExerciseType,
} from "./StudyPage.models";
import { EXERCISE_TYPE_SUBTITLES } from "./StudyPage.constants";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  isAnswerCorrect,
  buildMultipleChoiceOptions,
  buildReverseMultipleChoiceOptions,
  assignExerciseTypes,
  speakWord,
  playRecordingBlob,
} from "./StudyPage.helpers";
import {
  SignInAlert,
  StudyLoading,
  NoCardsDue,
  StudySetup,
  SessionComplete,
  RatingButtons,
  FlashcardBlock,
  ReverseFlashcardBlock,
  TypingBlock,
  MultipleChoiceBlock,
  ReverseMultipleChoiceBlock,
  ListeningBlock,
  SpeakingBlock,
  AnswerFeedbackBlock,
} from "./components";

export function StudyPage() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const { data: userLangs, isLoading: langsLoading } = useUserLanguages(userId);

  const pairOptions = useMemo(() => {
    if (!userLangs?.length) return [];
    const keySet = new Set<string>();
    userLangs.forEach((ul) =>
      keySet.add(getBidirectionalKey(ul.native_code, ul.learning_code)),
    );
    const list: { key: string; label: string }[] = [];
    keySet.forEach((key) => {
      const label =
        BIDIRECTIONAL_PAIRS.find((p) => p.key === key)?.label ?? `${key} ↔`;
      list.push({ key, label });
    });
    const hasVirtualPair = keySet.has("en-ru") && keySet.has("en-sr");
    if (hasVirtualPair) {
      list.push({
        key: VIRTUAL_PAIR_RU_SR.key,
        label: VIRTUAL_PAIR_RU_SR.label,
      });
    }
    return list;
  }, [userLangs]);

  const [selectedPairKey, setSelectedPairKey] = useState<string>(
    pairOptions[0]?.key ?? "",
  );
  const selectedPair = pairOptions.find((p) => p.key === selectedPairKey);
  const dueTodayFilters = useMemo(() => {
    if (!selectedPair) return undefined;
    const pairKey = selectedPair.key as "en-ru" | "en-sr" | "ru-sr";
    return { pairKey };
  }, [selectedPair]);
  const { data: dueTodayCards = [], isLoading: dueLoading } = useDueToday(
    userId,
    dueTodayFilters,
  );
  const updateFsrs = useUpdateUserVocabulary(userId ?? "");

  const [session, setSession] = useState<StudySessionState | null>(null);
  const [enabledExerciseTypes, setEnabledExerciseTypes] = useState<
    ExerciseType[]
  >([
    "flashcard",
    "reverse_flashcard",
    "multiple_choice",
    "reverse_multiple_choice",
    "typing",
    "listening",
    "speaking",
  ]);
  const [typingInput, setTypingInput] = useState("");
  const [answered, setAnswered] = useState<{
    correct: boolean;
    userAnswer?: string;
  } | null>(null);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const {
    recordingBlob,
    isRecording,
    error: recordingError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const isLoading = langsLoading;
  const canStart =
    selectedPair &&
    dueTodayCards.length > 0 &&
    !session &&
    enabledExerciseTypes.length > 0;

  const handlePairChange = useCallback((pairKey: string) => {
    setSelectedPairKey(pairKey);
  }, []);

  const handleToggleExerciseType = useCallback(
    (type: ExerciseType, checked: boolean) => {
      setEnabledExerciseTypes((prev) =>
        checked ? [...prev, type] : prev.filter((t) => t !== type),
      );
    },
    [],
  );

  const handleStartSession = useCallback(() => {
    if (!dueTodayCards.length || enabledExerciseTypes.length === 0) return;
    const exerciseTypes = assignExerciseTypes(
      dueTodayCards.length,
      enabledExerciseTypes,
    );
    setSession({
      cards: [...dueTodayCards],
      currentIndex: 0,
      exerciseTypes,
      enabledExerciseTypes: [...enabledExerciseTypes],
    });
    setTypingInput("");
    setAnswered(null);
    setFlashcardRevealed(false);
    clearRecording();
  }, [dueTodayCards, enabledExerciseTypes, clearRecording]);

  const handleRate = useCallback(
    (rating: StudyRating) => {
      if (!session || updateFsrs.isPending) return;
      const card = session.cards[session.currentIndex];
      if (!card) return;
      const updates = scheduleRating(card, rating);
      updateFsrs.mutate(
        { id: card.id, updates },
        {
          onSuccess: () => {
            setAnswered(null);
            setTypingInput("");
            setFlashcardRevealed(false);
            clearRecording();
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= session.cards.length) {
              setSession((prev) =>
                prev ? { ...prev, currentIndex: prev.cards.length } : null,
              );
            } else {
              setSession((prev) =>
                prev ? { ...prev, currentIndex: nextIndex } : null,
              );
            }
          },
        },
      );
    },
    [session, updateFsrs, clearRecording],
  );

  const handleRevealFlashcard = useCallback(
    () => setFlashcardRevealed(true),
    [],
  );

  const handleBackToStudy = useCallback(() => setSession(null), []);

  const currentCard: StudyCardItem | undefined = session
    ? session.cards[session.currentIndex]
    : undefined;
  const currentExerciseType: ExerciseType | undefined = session
    ? session.exerciseTypes[session.currentIndex]
    : undefined;
  const progress = session
    ? { current: session.currentIndex + 1, total: session.cards.length }
    : null;
  const multipleChoiceOptions = useMemo(
    () =>
      session && currentCard
        ? buildMultipleChoiceOptions(session.cards, currentCard)
        : [],
    [session, currentCard],
  );
  const reverseMultipleChoiceOptions = useMemo(
    () =>
      session && currentCard
        ? buildReverseMultipleChoiceOptions(session.cards, currentCard)
        : [],
    [session, currentCard],
  );

  const word = currentCard?.vocabulary?.word ?? "—";
  const translation = currentCard?.vocabulary?.translation ?? "—";
  const wordLang =
    currentCard?.vocabulary?.language_from ??
    selectedPair?.key?.split("-")[0] ??
    "en";

  const handlePlayWord = useCallback(
    () => speakWord(word, wordLang),
    [word, wordLang],
  );
  const handlePlayBack = useCallback(() => {
    if (recordingBlob) playRecordingBlob(recordingBlob);
  }, [recordingBlob]);

  const handleTypingCheck = useCallback(() => {
    const correct = isAnswerCorrect(typingInput, translation);
    setAnswered({ correct, userAnswer: typingInput });
  }, [typingInput, translation]);

  const handleTypingKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTypingCheck();
      }
    },
    [handleTypingCheck],
  );

  const handleMultipleChoiceSelect = useCallback(
    (option: string) =>
      setAnswered({
        correct: option === translation.trim(),
        userAnswer: option,
      }),
    [translation],
  );
  const handleReverseMultipleChoiceSelect = useCallback(
    (option: string) =>
      setAnswered({ correct: option === word.trim(), userAnswer: option }),
    [word],
  );

  // Condition constants for early returns
  const showSignInAlert = !userId;
  const showNoCardsDue =
    session === null &&
    dueTodayCards.length === 0 &&
    selectedPair !== undefined;
  const showStudySetup = session === null;
  const showSessionComplete = session !== null && currentCard === undefined;

  if (showSignInAlert) return <SignInAlert />;
  if (isLoading) return <StudyLoading />;
  if (showNoCardsDue) {
    return (
      <NoCardsDue
        pairOptions={pairOptions}
        selectedPairKey={selectedPairKey}
        onPairChange={handlePairChange}
      />
    );
  }
  if (showStudySetup) {
    return (
      <StudySetup
        pairOptions={pairOptions}
        selectedPairKey={selectedPairKey}
        onPairChange={handlePairChange}
        dueLoading={dueLoading}
        dueCount={dueTodayCards.length}
        enabledExerciseTypes={enabledExerciseTypes}
        onToggleExerciseType={handleToggleExerciseType}
        canStart={!!canStart}
        onStartSession={handleStartSession}
      />
    );
  }
  if (showSessionComplete && session) {
    return (
      <SessionComplete
        cardCount={session.cards.length}
        onBack={handleBackToStudy}
      />
    );
  }

  const isFlashcardType =
    currentExerciseType === "flashcard" ||
    currentExerciseType === "reverse_flashcard";
  const isSpeakingReady =
    currentExerciseType === "speaking" &&
    recordingBlob !== null &&
    !isRecording;
  const showRatingButtons =
    answered !== null ||
    (isFlashcardType && flashcardRevealed) ||
    isSpeakingReady;

  const ratingButtonsElement = (
    <RatingButtons onRate={handleRate} isPending={updateFsrs.isPending} />
  );

  const exerciseSubtitle =
    currentExerciseType != null
      ? EXERCISE_TYPE_SUBTITLES[currentExerciseType]
      : null;

  const isFlashcard = currentExerciseType === "flashcard";
  const isReverseFlashcard = currentExerciseType === "reverse_flashcard";
  const isTyping = currentExerciseType === "typing";
  const isMultipleChoice = currentExerciseType === "multiple_choice";
  const isReverseMultipleChoice =
    currentExerciseType === "reverse_multiple_choice";
  const isListening = currentExerciseType === "listening";
  const isSpeaking = currentExerciseType === "speaking";
  const showAnswerFeedback =
    showRatingButtons &&
    answered !== null &&
    !isFlashcardType &&
    currentExerciseType !== "speaking";
  const showRatingOnly =
    showRatingButtons &&
    (isFlashcardType || currentExerciseType === "speaking");
  const correctAnswerForFeedback =
    currentExerciseType === "reverse_multiple_choice" ? word : translation;

  return (
    <Box data-testid="study-card">
      <Typography variant="h4">Study</Typography>
      {progress && exerciseSubtitle != null && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Card {progress.current} of {progress.total} · {exerciseSubtitle}
        </Typography>
      )}
      <MuiCard sx={{ mt: 3, maxWidth: 480 }}>
        <CardContent>
          {isFlashcard && (
            <FlashcardBlock
              word={word}
              translation={translation}
              revealed={flashcardRevealed}
              onReveal={handleRevealFlashcard}
            />
          )}
          {isReverseFlashcard && (
            <ReverseFlashcardBlock
              word={word}
              translation={translation}
              revealed={flashcardRevealed}
              onReveal={handleRevealFlashcard}
            />
          )}
          {!showRatingButtons && isTyping && (
            <TypingBlock
              word={word}
              value={typingInput}
              onChange={setTypingInput}
              onCheck={handleTypingCheck}
              onKeyDown={handleTypingKeyDown}
            />
          )}
          {!showRatingButtons && isMultipleChoice && (
            <MultipleChoiceBlock
              word={word}
              options={multipleChoiceOptions}
              answered={answered !== null}
              onSelect={handleMultipleChoiceSelect}
            />
          )}
          {!showRatingButtons && isReverseMultipleChoice && (
            <ReverseMultipleChoiceBlock
              translation={translation}
              options={reverseMultipleChoiceOptions}
              answered={answered !== null}
              onSelect={handleReverseMultipleChoiceSelect}
            />
          )}
          {!showRatingButtons && isListening && (
            <ListeningBlock
              onPlayWord={handlePlayWord}
              options={multipleChoiceOptions}
              answered={answered !== null}
              onSelect={handleMultipleChoiceSelect}
            />
          )}
          {!showRatingButtons && isSpeaking && (
            <SpeakingBlock
              word={word}
              onPlayWord={handlePlayWord}
              isRecording={isRecording}
              recordingBlob={recordingBlob}
              recordingError={recordingError}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onPlayBack={handlePlayBack}
            />
          )}
          {showAnswerFeedback && answered != null && (
            <AnswerFeedbackBlock
              correct={answered.correct}
              userAnswer={answered.userAnswer}
              correctAnswer={correctAnswerForFeedback}
              ratingButtons={ratingButtonsElement}
            />
          )}
          {showRatingOnly && ratingButtonsElement}
        </CardContent>
      </MuiCard>
    </Box>
  );
}
