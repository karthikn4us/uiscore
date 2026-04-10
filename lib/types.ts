export interface CategoryResult {
  score: number;
  feedback: string[];
}

export interface AnalysisResult {
  overall: number;
  categories: {
    typography: CategoryResult;
    color: CategoryResult;
    spacing: CategoryResult;
    layout: CategoryResult;
    polish: CategoryResult;
  };
  summary: string;
  topStrength: string;
  topImprovement: string;
}

export type AppState = "idle" | "loading" | "results" | "error";

export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  typography: {
    label: "Typography",
    icon: "Aa",
    description: "Font choices, hierarchy, readability",
  },
  color: {
    label: "Color",
    icon: "\u25CF",
    description: "Palette harmony, contrast, mood",
  },
  spacing: {
    label: "Spacing",
    icon: "\u2194",
    description: "Rhythm, whitespace, density",
  },
  layout: {
    label: "Layout",
    icon: "\u25A6",
    description: "Hierarchy, alignment, structure",
  },
  polish: {
    label: "Polish",
    icon: "\u2728",
    description: "Detail, consistency, finish",
  },
};
