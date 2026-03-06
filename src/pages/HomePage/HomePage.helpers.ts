import { getBidirectionalKey } from "@/types";
import type { VocabularyScoreWithVocabulary } from "@/api/vocabulary";
import type { HomeStats } from "./HomePage.models";

export function buildHomeStats(
  scoreRows: VocabularyScoreWithVocabulary[],
): HomeStats {
  const trackedWords = scoreRows.length;
  const learntWords = scoreRows.filter((scoreRow) => scoreRow.learnt).length;
  const totalScore = scoreRows.reduce(
    (sum, scoreRow) => sum + scoreRow.score,
    0,
  );
  const averageScore =
    trackedWords > 0 ? Math.round((totalScore / trackedWords) * 10) / 10 : 0;

  const uniquePairKeys = new Set<string>();
  for (const scoreRow of scoreRows) {
    const languageFrom = scoreRow.vocabulary?.language_from;
    const languageTo = scoreRow.vocabulary?.language_to;
    if (!languageFrom || !languageTo) continue;
    uniquePairKeys.add(getBidirectionalKey(languageFrom, languageTo));
  }

  return {
    trackedWords,
    learntWords,
    averageScore,
    pairCount: uniquePairKeys.size,
  };
}
