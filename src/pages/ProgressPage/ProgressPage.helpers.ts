import type { VocabularyScoreWithVocabulary } from "@/api/vocabulary";
import { BIDIRECTIONAL_PAIRS, VIRTUAL_PAIR_RU_SR } from "@/types";
import { getBidirectionalKey } from "@/types";
import type {
  ProgressDirectionStats,
  ProgressPairStats,
} from "./ProgressPage.models";
import { PROGRESS_DIRECTION_LABELS } from "./ProgressPage.constants";

/**
 * Build direction key from vocabulary row: language_from-language_to.
 */
function getDirectionKey(from: string, to: string): string {
  return `${from}-${to}`;
}

/**
 * Aggregate vocabulary_score rows (with vocabulary) into stats per direction, then per pair.
 * Only includes pairs the user has at least one score for; uses BIDIRECTIONAL_PAIRS + VIRTUAL_PAIR_RU_SR for labels.
 */
export function aggregateProgressByPair(
  rows: VocabularyScoreWithVocabulary[],
): ProgressPairStats[] {
  const byDirection = new Map<
    string,
    { scores: number[]; learnt: number; lastAt: string | null }
  >();

  for (const row of rows) {
    const vocab = row.vocabulary;
    if (!vocab) continue;
    const directionKey = getDirectionKey(
      vocab.language_from,
      vocab.language_to,
    );
    const existing = byDirection.get(directionKey) ?? {
      scores: [],
      learnt: 0,
      lastAt: null as string | null,
    };
    existing.scores.push(row.score);
    if (row.learnt) existing.learnt += 1;
    if (
      row.last_exercise_at &&
      (!existing.lastAt || row.last_exercise_at > existing.lastAt)
    ) {
      existing.lastAt = row.last_exercise_at;
    }
    byDirection.set(directionKey, existing);
  }

  const pairKeyToDirections = new Map<
    string,
    { fromTo: string; toFrom: string }
  >();
  for (const [dirKey] of byDirection) {
    const [from, to] = dirKey.split("-");
    if (from && to) {
      const pairKey = getBidirectionalKey(from, to);
      const existing = pairKeyToDirections.get(pairKey);
      if (!existing) {
        pairKeyToDirections.set(pairKey, {
          fromTo: dirKey,
          toFrom: `${to}-${from}`,
        });
      }
    }
  }

  const pairLabels: Record<string, string> = {};
  for (const pair of BIDIRECTIONAL_PAIRS) {
    pairLabels[pair.key] = pair.label;
  }
  pairLabels[VIRTUAL_PAIR_RU_SR.key] = VIRTUAL_PAIR_RU_SR.label;

  const result: ProgressPairStats[] = [];
  for (const [pairKey, { fromTo, toFrom }] of pairKeyToDirections) {
    const fromToData = byDirection.get(fromTo);
    const toFromData = byDirection.get(toFrom);
    const directionFromTo = fromToData
      ? toDirectionStats(fromTo, fromToData)
      : null;
    const directionToFrom = toFromData
      ? toDirectionStats(toFrom, toFromData)
      : null;
    result.push({
      pairKey,
      pairLabel: pairLabels[pairKey] ?? `${pairKey} ↔`,
      directionFromTo,
      directionToFrom,
    });
  }

  result.sort((a, b) => a.pairKey.localeCompare(b.pairKey));
  return result;
}

function toDirectionStats(
  directionKey: string,
  data: {
    scores: number[];
    learnt: number;
    lastAt: string | null;
  },
): ProgressDirectionStats {
  const sum = data.scores.reduce((acc, s) => acc + s, 0);
  const averageScore =
    data.scores.length > 0
      ? Math.round((sum / data.scores.length) * 10) / 10
      : 0;
  return {
    directionKey,
    directionLabel: PROGRESS_DIRECTION_LABELS[directionKey] ?? directionKey,
    wordCount: data.scores.length,
    averageScore,
    learntCount: data.learnt,
    lastStudiedAt: data.lastAt,
  };
}
