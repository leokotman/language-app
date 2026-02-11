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
} from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import { useUserLanguages } from '@/hooks/useUserLanguages'
import { useDueToday, useUpdateUserVocabulary } from '@/hooks/useVocabulary'
import { scheduleRating, StudyRating } from '@/lib/fsrs'
import { getBidirectionalKey } from '@/types'
import { BIDIRECTIONAL_PAIRS } from '@/types'
import type { StudyCardItem, StudySessionState } from './StudyPage.models'
import { STUDY_RATING_LABELS } from './StudyPage.constants'

export function StudyPage() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id
  const { data: userLangs, isLoading: langsLoading } = useUserLanguages(userId)

  const pairOptions = useMemo(() => {
    if (!userLangs?.length) return []
    return userLangs.map((ul) => {
      const key = getBidirectionalKey(ul.native_code, ul.learning_code)
      const label = BIDIRECTIONAL_PAIRS.find((p) => p.key === key)?.label ?? `${key} ↔`
      return { key, label, languageFrom: ul.native_code, languageTo: ul.learning_code }
    })
  }, [userLangs])

  const [selectedPairKey, setSelectedPairKey] = useState<string>(pairOptions[0]?.key ?? '')
  const selectedPair = pairOptions.find((p) => p.key === selectedPairKey)
  const dueTodayFilters = useMemo(
    () =>
      selectedPair
        ? { languageFrom: selectedPair.languageFrom, languageTo: selectedPair.languageTo }
        : undefined,
    [selectedPair]
  )
  const { data: dueTodayCards = [], isLoading: dueLoading } = useDueToday(userId, dueTodayFilters)
  const updateFsrs = useUpdateUserVocabulary(userId ?? '')

  const [session, setSession] = useState<StudySessionState | null>(null)
  const [revealed, setRevealed] = useState(false)

  const isLoading = langsLoading
  const canStart = selectedPair && dueTodayCards.length > 0 && !session

  const handleStartSession = () => {
    if (!dueTodayCards.length) return
    setSession({ cards: [...dueTodayCards], currentIndex: 0 })
    setRevealed(false)
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
          const nextIndex = session.currentIndex + 1
          if (nextIndex >= session.cards.length) {
            setSession(null)
          } else {
            setSession((prev) => prev ? { ...prev, currentIndex: nextIndex } : null)
            setRevealed(false)
          }
        },
      }
    )
  }

  const currentCard: StudyCardItem | undefined = session
    ? session.cards[session.currentIndex]
    : undefined
  const progress = session
    ? { current: session.currentIndex + 1, total: session.cards.length }
    : null

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
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading due cards…</Typography>
          </Box>
        ) : (
          <Box mt={2}>
            <Typography sx={{ mb: 1 }}>
              <strong>{dueTodayCards.length}</strong> card{dueTodayCards.length !== 1 ? 's' : ''}{' '}
              due today
            </Typography>
            <Button
              variant="contained"
              onClick={handleStartSession}
              disabled={!canStart}
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
      <Box>
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

  return (
    <Box>
      <Typography variant="h4">Study</Typography>
      {progress && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Card {progress.current} of {progress.total}
        </Typography>
      )}
      <MuiCard sx={{ mt: 3, maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" component="p" sx={{ mb: 2 }}>
            {word}
          </Typography>
          {!revealed ? (
            <Button variant="outlined" onClick={() => setRevealed(true)}>
              Reveal translation
            </Button>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {translation}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {(Object.keys(STUDY_RATING_LABELS) as Array<keyof typeof STUDY_RATING_LABELS>).map(
                  (label) => {
                    const rating = StudyRating[label]
                    return (
                      <Button
                        key={label}
                        variant="contained"
                        color={label === 'Again' ? 'error' : 'primary'}
                        size="small"
                        disabled={updateFsrs.isPending}
                        onClick={() => handleRate(rating)}
                      >
                        {STUDY_RATING_LABELS[label]}
                      </Button>
                    )
                  }
                )}
              </Box>
            </>
          )}
        </CardContent>
      </MuiCard>
    </Box>
  )
}
