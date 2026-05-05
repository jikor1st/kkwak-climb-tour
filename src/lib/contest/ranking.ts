import { createServerClient } from "@/lib/supabase/server"
import { loadDifficultySystem, type DivisionView, buildDivisionView } from "./grades"

export type RankingRow = {
  participantId: string
  displayName: string
  divisionId: string
  divisionLabel: string
  divisionColor: string
  divisionBg: string
  participantType: "crew" | "guest"
  paid: boolean
  grade: string
  solved: number
  total: number
  rate: number
  rank: number
}

export type RankingGroupView = {
  id: string
  name: string
  divisions: DivisionView[]
  rows: RankingRow[]
}

export type RankingData = {
  groups: RankingGroupView[]
  ungrouped: RankingGroupView | null
  resultsLocked: boolean
}

export async function loadRankings(): Promise<RankingData> {
  const supabase = createServerClient()
  const system = await loadDifficultySystem()

  const [partsRes, gcRes, solvesRes, settingsRes] = await Promise.all([
    supabase
      .from("participants")
      .select("id, display_name, division_id, participant_type, paid"),
    supabase.from("grade_counts").select("grade, total_count"),
    supabase.from("solves").select("participant_id, grade, solved_count"),
    supabase
      .from("contest_settings")
      .select("results_locked")
      .eq("id", 1)
      .maybeSingle(),
  ])

  const totalsByGrade = new Map<string, number>()
  for (const g of gcRes.data ?? []) {
    const grade = g.grade as string
    totalsByGrade.set(grade, (totalsByGrade.get(grade) ?? 0) + (g.total_count ?? 0))
  }

  const solvedKey = (pid: string, grade: string) => `${pid}:${grade}`
  const solvedByPartGrade = new Map<string, number>()
  for (const s of solvesRes.data ?? []) {
    const key = solvedKey(s.participant_id, s.grade as string)
    solvedByPartGrade.set(
      key,
      (solvedByPartGrade.get(key) ?? 0) + (s.solved_count ?? 0),
    )
  }

  const rowsByGroup = new Map<string, RankingRow[]>()
  const ungroupedRows: RankingRow[] = []

  for (const p of partsRes.data ?? []) {
    const division = system.divisionsById[p.division_id]
    if (!division) continue
    const grade = system.gradesById[division.solve_grade]
    const view = buildDivisionView(division, grade)
    const total = totalsByGrade.get(division.solve_grade) ?? 0
    const solved = solvedByPartGrade.get(solvedKey(p.id, division.solve_grade)) ?? 0
    const rate = total > 0 ? Math.round((solved / total) * 100 * 10) / 10 : 0
    const row: RankingRow = {
      participantId: p.id,
      displayName: p.display_name,
      divisionId: division.id,
      divisionLabel: division.label,
      divisionColor: view.color,
      divisionBg: view.bg,
      participantType: p.participant_type as "crew" | "guest",
      paid: !!p.paid,
      grade: division.solve_grade,
      solved,
      total,
      rate,
      rank: 0,
    }
    if (division.ranking_group_id) {
      const arr = rowsByGroup.get(division.ranking_group_id) ?? []
      arr.push(row)
      rowsByGroup.set(division.ranking_group_id, arr)
    } else {
      ungroupedRows.push(row)
    }
  }

  const sortAndRank = (list: RankingRow[]): RankingRow[] => {
    const sorted = [...list].sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate
      return b.solved - a.solved
    })
    let lastRate = -1
    let lastSolved = -1
    let lastRank = 0
    return sorted.map((row, i) => {
      if (row.rate !== lastRate || row.solved !== lastSolved) {
        lastRank = i + 1
        lastRate = row.rate
        lastSolved = row.solved
      }
      return { ...row, rank: lastRank }
    })
  }

  const groups: RankingGroupView[] = system.rankingGroups.map((g) => {
    const divisions = system.divisions
      .filter((d) => d.ranking_group_id === g.id)
      .map((d) => buildDivisionView(d, system.gradesById[d.solve_grade]))
    const rows = sortAndRank(rowsByGroup.get(g.id) ?? [])
    return { id: g.id, name: g.name, divisions, rows }
  })

  const ungrouped: RankingGroupView | null =
    ungroupedRows.length > 0
      ? {
          id: "__ungrouped__",
          name: "그룹 미지정",
          divisions: system.divisions
            .filter((d) => d.ranking_group_id === null)
            .map((d) => buildDivisionView(d, system.gradesById[d.solve_grade])),
          rows: sortAndRank(ungroupedRows),
        }
      : null

  return {
    groups,
    ungrouped,
    resultsLocked: !!settingsRes.data?.results_locked,
  }
}
