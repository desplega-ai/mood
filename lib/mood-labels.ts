export const MOOD_LABELS = {
  0: "Terrible",
  1: "Bad",
  2: "Meh",
  3: "Okay",
  4: "Good",
  5: "Excellent",
} as const;

export type MoodScore = 0 | 1 | 2 | 3 | 4 | 5;

export function getMoodLabel(score: MoodScore): string {
  return MOOD_LABELS[score];
}

export function getMoodColor(score: MoodScore): string {
  const colors = {
    0: "#ef4444", // red
    1: "#f97316", // orange
    2: "#f59e0b", // amber
    3: "#eab308", // yellow
    4: "#84cc16", // lime
    5: "#22c55e", // green
  };
  return colors[score];
}
