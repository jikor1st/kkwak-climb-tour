export const CATEGORY_TO_GRADE = {
  advanced: "red",
  intermediate: "blue",
  beginner: "green",
} as const

export type Category = keyof typeof CATEGORY_TO_GRADE
export type SolveGrade = (typeof CATEGORY_TO_GRADE)[Category]

export const CATEGORY_META: Record<
  Category,
  { label: string; solveLabel: string; color: string; bg: string }
> = {
  advanced: {
    label: "상급",
    solveLabel: "빨강 풀이",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  intermediate: {
    label: "중급",
    solveLabel: "파랑 풀이",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  beginner: {
    label: "초급",
    solveLabel: "초록 풀이",
    color: "#16A34A",
    bg: "#F0FDF4",
  },
}

export const GRADE_LABEL: Record<string, string> = {
  purple: "보라",
  pink: "핑크",
  red: "빨강",
  blue: "파랑",
  green: "초록",
  yellow: "노랑",
  orange: "주황",
  white: "흰색",
  gray: "회색",
}

export const GRADE_COLOR: Record<string, string> = {
  purple: "#9333EA",
  pink: "#DB2777",
  red: "#DC2626",
  blue: "#2563EB",
  green: "#16A34A",
  yellow: "#EAB308",
  orange: "#EA580C",
  white: "#FFFFFF",
  gray: "#6B7280",
}
