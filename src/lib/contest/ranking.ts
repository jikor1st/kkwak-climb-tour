import { createServerClient } from "@/lib/supabase/server"
import { CATEGORY_TO_GRADE, type Category, type SolveGrade } from "./grades"

export type RankingRow = {
  participantId: string
  displayName: string
  category: Category
  participantType: "crew" | "guest"
  paid: boolean
  grade: SolveGrade
  solved: number
  total: number
  rate: number
  rank: number
}

export type RankingData = {
  advanced: RankingRow[]
  midBeginnerCombined: RankingRow[]
  resultsLocked: boolean
}

export async function loadRankings(): Promise<RankingData> {
  const supabase = createServerClient()

  const [partsRes, gcRes, solvesRes, settingsRes] = await Promise.all([
    supabase
      .from("participants")
      .select("id, display_name, category, participant_type, paid"),
    supabase.from("grade_counts").select("grade, total_count"),
    supabase.from("solves").select("participant_id, grade, solved_count"),
    supabase
      .from("contest_settings")
      .select("results_locked")
      .eq("id", 1)
      .maybeSingle(),
  ])

  const totalsByGrade = new Map<SolveGrade, number>()
  for (const g of gcRes.data ?? []) {
    const grade = g.grade as SolveGrade
    totalsByGrade.set(grade, (totalsByGrade.get(grade) ?? 0) + (g.total_count ?? 0))
  }

  const solvedKey = (pid: string, grade: SolveGrade) => `${pid}:${grade}`
  const solvedByPartGrade = new Map<string, number>()
  for (const s of solvesRes.data ?? []) {
    const key = solvedKey(s.participant_id, s.grade as SolveGrade)
    solvedByPartGrade.set(
      key,
      (solvedByPartGrade.get(key) ?? 0) + (s.solved_count ?? 0),
    )
  }

  const rows: RankingRow[] = (partsRes.data ?? []).map((p) => {
    const category = p.category as Category
    const grade = CATEGORY_TO_GRADE[category]
    const total = totalsByGrade.get(grade) ?? 0
    const solved = solvedByPartGrade.get(solvedKey(p.id, grade)) ?? 0
    const rate = total > 0 ? Math.round((solved / total) * 100 * 10) / 10 : 0
    return {
      participantId: p.id,
      displayName: p.display_name,
      category,
      participantType: p.participant_type as "crew" | "guest",
      paid: !!p.paid,
      grade,
      solved,
      total,
      rate,
      rank: 0,
    }
  })

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

  return {
    advanced: sortAndRank(rows.filter((r) => r.category === "advanced")),
    midBeginnerCombined: sortAndRank(
      rows.filter(
        (r) => r.category === "intermediate" || r.category === "beginner",
      ),
    ),
    resultsLocked: !!settingsRes.data?.results_locked,
  }
}
