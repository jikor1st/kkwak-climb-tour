import { createServerClient } from "@/lib/supabase/server"

export type Grade = {
  id: string
  label: string
  color_hex: string
  sort_order: number
}

export type RankingGroup = {
  id: string
  name: string
  sort_order: number
}

export type Division = {
  id: string
  label: string
  solve_grade: string
  ranking_group_id: string | null
  sort_order: number
  desc_text: string
  active: boolean
}

export type DivisionRecommendation = {
  challenge_grade: string
  division_id: string
}

export type DifficultySystem = {
  grades: Grade[]
  gradesById: Record<string, Grade>
  divisions: Division[]
  divisionsById: Record<string, Division>
  rankingGroups: RankingGroup[]
  rankingGroupsById: Record<string, RankingGroup>
  recommendations: DivisionRecommendation[]
}

export async function loadDifficultySystem(): Promise<DifficultySystem> {
  const supabase = createServerClient()

  const [gRes, dRes, rgRes, recRes] = await Promise.all([
    supabase
      .from("grades")
      .select("id, label, color_hex, sort_order")
      .order("sort_order"),
    supabase
      .from("divisions")
      .select(
        "id, label, solve_grade, ranking_group_id, sort_order, desc_text, active",
      )
      .order("sort_order"),
    supabase
      .from("ranking_groups")
      .select("id, name, sort_order")
      .order("sort_order"),
    supabase
      .from("division_recommendations")
      .select("challenge_grade, division_id"),
  ])

  const grades = (gRes.data ?? []) as Grade[]
  const divisions = (dRes.data ?? []) as Division[]
  const rankingGroups = (rgRes.data ?? []) as RankingGroup[]
  const recommendations = (recRes.data ?? []) as DivisionRecommendation[]

  return {
    grades,
    gradesById: Object.fromEntries(grades.map((g) => [g.id, g])),
    divisions,
    divisionsById: Object.fromEntries(divisions.map((d) => [d.id, d])),
    rankingGroups,
    rankingGroupsById: Object.fromEntries(rankingGroups.map((r) => [r.id, r])),
    recommendations,
  }
}

export type DivisionView = {
  id: string
  label: string
  desc_text: string
  solve_grade: string
  solve_grade_label: string
  color: string
  bg: string
  ranking_group_id: string | null
}

const DEFAULT_BG = "#F4F4F4"

function softBg(hex: string): string {
  const h = hex.replace("#", "")
  if (h.length !== 6) return DEFAULT_BG
  return `#${h}1A`
}

export function buildDivisionView(d: Division, g?: Grade): DivisionView {
  const color = g?.color_hex ?? "#6B7280"
  return {
    id: d.id,
    label: d.label,
    desc_text: d.desc_text,
    solve_grade: d.solve_grade,
    solve_grade_label: g?.label ?? d.solve_grade,
    color,
    bg: softBg(color),
    ranking_group_id: d.ranking_group_id,
  }
}

export function divisionView(
  divisionId: string,
  system: Pick<DifficultySystem, "divisionsById" | "gradesById">,
): DivisionView | null {
  const d = system.divisionsById[divisionId]
  if (!d) return null
  return buildDivisionView(d, system.gradesById[d.solve_grade])
}
