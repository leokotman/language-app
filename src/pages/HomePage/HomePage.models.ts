export interface HomeQuickAction {
  label: string;
  description: string;
  to: string;
  testId: string;
}

export interface HomeStats {
  trackedWords: number;
  learntWords: number;
  averageScore: number;
  pairCount: number;
}
