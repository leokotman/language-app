import { useMemo, useState } from 'react'
import {
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card as MuiCard,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import { useUserLanguages } from '@/hooks/useUserLanguages'
import { useDueToday, useUpdateUserVocabulary } from '@/hooks/useVocabulary'
import { scheduleRating, StudyRating } from '@/lib/fsrs'
import { getBidirectionalKey } from '@/types'
import { BIDIRECTIONAL_PAIRS, VIRTUAL_PAIR_RU_SR } from '@/types'
import type { StudyCardItem, StudySessionState, ExerciseType } from './StudyPage.models'
import { STUDY_RATING_LABELS, EXERCISE_TYPE_OPTIONS } from './StudyPage.constants'
import {
  isAnswerCorrect,
  buildMultipleChoiceOptions,
  assignExerciseTypes,
} from './StudyPage.helpers'

export function StudyPage() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id
  const { data: userLangs, isLoading: langsLoading } = useUserLanguages(userId)

  const pairOptions = useMemo(() => {
    if (!userLangs?.length) return []
    const keySet = new Set<string>()
    userLangs.forEach((ul) => keySet.add(getBidirectionalKey(ul.native_code, ul.learning_code)))
    const list: { key: string; label: string }[] = []
    keySet.forEach((key) => {
      const label = BIDIRECTIONAL_PAIRS.find((p) => p.key === key)?.label ?? `${key} ↔`
      list.push({ key, label })
    })
    const hasVirtualPair = keySet.has('en-ru') && keySet.has('en-sr')
    if (hasVirtualPair) {
      list.push({ key: VIRTUAL_PAIR_RU_SR.key, label: VIRTUAL_PAIR_RU_SR.label })
    }
    return list
  }, [userLangs])

  const [selectedPairKey, setSelectedPairKey] = useState<string>(pairOptions[0]?.key ?? '')
  const selectedPair = pairOptions.find((p) => p.key === selectedPairKey)
  const dueTodayFilters = useMemo(() => {
    if (!selectedPair) return undefined
    const pairKey = selectedPair.key as 'en-ru' | 'en-sr' | 'ru-sr'
    return { pairKey }
  }, [selectedPair])
  const { data: dueTodayCards = [], isLoading: dueLoading } = useDueToday(userId, dueTodayFilters)
  const updateFsrs = useUpdateUserVocabulary(userId ?? '')

  const [session, setSession] = useState<StudySessionState | null>(null)
  const [enabledExerciseTypes, setEnabledExerciseTypes] = useState<ExerciseType[]>([
    'flashcard',
    'reverse_flashcard',
    'multiple_choice',
    'typing',
  ])
  const [typingInput, setTypingInput] = useState('')
  const [answered, setAnswered] = useState<{ correct: boolean; userAnswer?: string } | null>(null)
  /** For flashcard / reverse_flashcard: true = revealed, show rating buttons. */
  const [flashcardRevealed, setFlashcardRevealed] = useState(false)

  const isLoading = langsLoading
  const canStart =
    selectedPair &&
    dueTodayCards.length > 0 &&
    !session &&
    enabledExerciseTypes.length > 0

  const handleToggleExerciseType = (type: ExerciseType, checked: boolean) => {
    setEnabledExerciseTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    )
  }

  const handleStartSession = () => {
    if (!dueTodayCards.length || enabledExerciseTypes.length === 0) return
    const exerciseTypes = assignExerciseTypes(dueTodayCards.length, enabledExerciseTypes)
    setSession({
      cards: [...dueTodayCards],
      currentIndex: 0,
      exerciseTypes,
      enabledExerciseTypes: [...enabledExerciseTypes],
    })
    setTypingInput('')
    setAnswered(null)
    setFlashcardRevealed(false)
  }

  const handleRate = (rating: StudyRating) => {
    if (!session || updateFsrs.isPending) return
    const card = session.cards[session.currentIndex]
    if (!card) return
    const updates = scheduleRating(card, rating)
    updateFsrs.mutate(
      { id: card.id, updates },
      {
        onSuccess: () => {
          setAnswered(null)
          setTypingInput('')
          setFlashcardRevealed(false)
          const nextIndex = session.currentIndex + 1
          if (nextIndex >= session.cards.length) {
            setSession((prev) => (prev ? { ...prev, currentIndex: prev.cards.length } : null))
          } else {
            setSession((prev) => (prev ? { ...prev, currentIndex: nextIndex } : null))
          }
        },
      }
    )
  }

  const currentCard: StudyCardItem | undefined = session
    ? session.cards[session.currentIndex]
    : undefined
  const currentExerciseType: ExerciseType | undefined = session
    ? session.exerciseTypes[session.currentIndex]
    : undefined
  const progress = session
    ? { current: session.currentIndex + 1, total: session.cards.length }
    : null
  const multipleChoiceOptions = useMemo(
    () => (session && currentCard ? buildMultipleChoiceOptions(session.cards, currentCard) : []),
    [session, currentCard]
  )

  if (!userId) {
    return (
      <Box>
        <Typography variant="h4">Study</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Sign in to study your vocabulary.
        </Alert>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (session === null && dueTodayCards.length === 0 && selectedPair) {
    return (
      <Box>
        <Typography variant="h4">Study</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No cards due today for this language pair. Add words in Library or come back later.
        </Typography>
        {pairOptions.length > 0 && (
          <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
            <InputLabel>Language pair</InputLabel>
            <Select
              value={selectedPairKey}
              label="Language pair"
              onChange={(e) => setSelectedPairKey(e.target.value)}
            >
              {pairOptions.map((opt) => (
                <MenuItem key={opt.key} value={opt.key}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    )
  }

  if (session === null) {
    return (
      <Box>
        <Typography variant="h4">Study</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Choose a language pair and start a study session with cards due today.
        </Typography>
        {pairOptions.length > 0 && (
          <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
            <InputLabel>Language pair</InputLabel>
            <Select
              value={selectedPairKey}
              label="Language pair"
              onChange={(e) => setSelectedPairKey(e.target.value)}
            >
              {pairOptions.map((opt) => (
                <MenuItem key={opt.key} value={opt.key}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {dueLoading ? (
          <Box display="flex" alignItems="center" gap={1} mt={2} data-testid="study-due-loading">
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading due cards…</Typography>
          </Box>
        ) : (
          <Box mt={2} data-testid="study-setup">
            <Typography sx={{ mb: 1 }}>
              <strong>{dueTodayCards.length}</strong> card{dueTodayCards.length !== 1 ? 's' : ''}{' '}
              due today
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
              Exercise types
            </Typography>
            <FormGroup row>
              {EXERCISE_TYPE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.type}
                  control={
                    <Checkbox
                      checked={enabledExerciseTypes.includes(opt.type)}
                      onChange={(_, checked) => handleToggleExerciseType(opt.type, checked)}
                    />
                  }
                  label={
                    <span>
                      {opt.label} <Typography component="span" variant="caption" color="text.secondary">({opt.difficulty})</Typography>
                    </span>
                  }
                />
              ))}
            </FormGroup>
            <Button
              variant="contained"
              onClick={handleStartSession}
              disabled={!canStart}
              sx={{ mt: 2 }}
              data-testid="study-start-session"
            >
              Start session
            </Button>
          </Box>
        )}
      </Box>
    )
  }

  if (!currentCard) {
    return (
      <Box data-testid="study-session-complete">
        <Typography variant="h4">Session complete</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          You reviewed all {session.cards.length} cards. Great job!
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setSession(null)}>
          Back to study
        </Button>
      </Box>
    )
  }

  const vocab = currentCard.vocabulary
  const word = vocab?.word ?? '—'
  const translation = vocab?.translation ?? '—'

  const isFlashcardType =
    currentExerciseType === 'flashcard' || currentExerciseType === 'reverse_flashcard'
  const showRatingButtons =
    answered !== null || (isFlashcardType && flashcardRevealed)
  const ratingButtons = (
    <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
      {(Object.keys(STUDY_RATING_LABELS) as Array<keyof typeof STUDY_RATING_LABELS>).map(
        (label) => {
          const rating = StudyRating[label]
          return (
            <Button
              key={label}
              variant="contained"
              color={label === 'Again' ? 'error' : 'primary'}
              size="small"
              disabled={false}
              aria-busy={updateFsrs.isPending}
              onClick={() => handleRate(rating)}
            >
              {STUDY_RATING_LABELS[label]}
            </Button>
          )
        }
      )}
    </Box>
  )

  return (
    <Box data-testid="study-card">
      <Typography variant="h4">Study</Typography>
      {progress && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Card {progress.current} of {progress.total}
          {currentExerciseType === 'flashcard' && ' · Flashcard'}
          {currentExerciseType === 'reverse_flashcard' && ' · Reverse flashcard'}
          {currentExerciseType === 'typing' && ' · Written'}
          {currentExerciseType === 'multiple_choice' && ' · Multiple choice'}
        </Typography>
      )}
      <MuiCard sx={{ mt: 3, maxWidth: 480 }}>
        <CardContent>
          {/* Flashcard: show word, then reveal translation on click */}
          {currentExerciseType === 'flashcard' && (
            <>
              <Typography variant="h5" component="p" sx={{ mb: 2 }}>
                {word}
              </Typography>
              {!flashcardRevealed ? (
                <Button variant="contained" onClick={() => setFlashcardRevealed(true)}>
                  Reveal translation
                </Button>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {translation}
                </Typography>
              )}
            </>
          )}

          {/* Reverse flashcard: show translation, then reveal word on click */}
          {currentExerciseType === 'reverse_flashcard' && (
            <>
              <Typography variant="h5" component="p" sx={{ mb: 2 }}>
                {translation}
              </Typography>
              {!flashcardRevealed ? (
                <Button variant="contained" onClick={() => setFlashcardRevealed(true)}>
                  Reveal word
                </Button>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {word}
                </Typography>
              )}
            </>
          )}

          {!showRatingButtons && currentExerciseType === 'typing' && (
            <>
              <Typography variant="h5" component="p" sx={{ mb: 2 }}>
                {word}
              </Typography>
              <TextField
                fullWidth
                label="Translation"
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const correct = isAnswerCorrect(typingInput, translation)
                    setAnswered({ correct, userAnswer: typingInput })
                  }
                }}
                autoFocus
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  const correct = isAnswerCorrect(typingInput, translation)
                  setAnswered({ correct, userAnswer: typingInput })
                }}
              >
                Check
              </Button>
            </>
          )}

          {!showRatingButtons && currentExerciseType === 'multiple_choice' && (
            <>
              <Typography variant="h5" component="p" sx={{ mb: 2 }}>
                {word}
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {multipleChoiceOptions.map((option) => (
                  <Button
                    key={option}
                    variant="outlined"
                    onClick={() =>
                      setAnswered({ correct: option === translation.trim(), userAnswer: option })
                    }
                    disabled={answered !== null}
                  >
                    {option}
                  </Button>
                ))}
              </Box>
            </>
          )}


          {showRatingButtons && answered !== null && !isFlashcardType && (
            <>
              {answered.correct ? (
                <Typography color="success.main" sx={{ mb: 1 }}>
                  Correct!
                </Typography>
              ) : (
                <Typography color="error" sx={{ mb: 1 }}>
                  Wrong.{' '}
                  {answered.userAnswer && (
                    <Typography component="span" color="text.secondary">
                      Correct: {translation}
                    </Typography>
                  )}
                </Typography>
              )}
              {ratingButtons}
            </>
          )}
          {showRatingButtons && isFlashcardType && (
            <>
              {ratingButtons}
            </>
          )}
        </CardContent>
      </MuiCard>
    </Box>
  )
}
