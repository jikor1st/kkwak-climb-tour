import { createServerClient } from "@/lib/supabase/server"
import { loadDifficultySystem, buildDivisionView, type DivisionView } from "./grades"
import type { ScheduleBreak } from "./schedule"

export type WallData = {
  id: string
  name: string
  display_order: number
  total_count: number
  solved_count: number
}

export type GymData = {
  id: string
  name: string
  display_order: number
  walls: WallData[]
  total_count: number
  solved_count: number
  duration_minutes: number
}

export type ContestSettings = {
  start_time: string | null
  end_time: string | null
  default_gym_minutes: number
  lunch_minutes: number
  lunch_start_time: string | null
  contest_date: string | null
  signup_notice: string
  entry_fee: number
  kakaopay_link: string
}

// 결제 정보 묶음 — Dashboard/Record/Signup 전반에서 동일한
// PaymentInfoCard로 사용. 어떤 페이지든 contest_settings에서 동일한
// 형태로 뽑아갈 수 있게 한 곳에 정리한다.
export type PaymentInfo = {
  entryFee: number
  kakaopayLink: string
  notice: string
}

export function buildPaymentInfo(s: ContestSettings): PaymentInfo {
  return {
    entryFee: s.entry_fee,
    kakaopayLink: s.kakaopay_link.trim(),
    notice: s.signup_notice.trim(),
  }
}

export type ContestData = {
  gyms: GymData[]
  breaks: ScheduleBreak[]
  totalSolved: number
  totalCount: number
  completionRate: number
  grade: string
  division: DivisionView
  settings: ContestSettings
}

export async function loadContestData(
  participantId: string,
  divisionId: string,
): Promise<ContestData> {
  const supabase = createServerClient()
  const system = await loadDifficultySystem()
  const division = system.divisionsById[divisionId]
  if (!division) {
    throw new Error(`Unknown division_id: ${divisionId}`)
  }
  const view = buildDivisionView(division, system.gradesById[division.solve_grade])
  const grade = division.solve_grade

  const [gymsRes, wallsRes, gcRes, solvesRes, durRes, settingsRes, breaksRes] =
    await Promise.all([
      supabase
        .from("gyms")
        .select("id, name, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("walls")
        .select("id, gym_id, name, display_order, active")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("grade_counts")
        .select("wall_id, total_count")
        .eq("grade", grade),
      supabase
        .from("solves")
        .select("wall_id, solved_count")
        .eq("participant_id", participantId)
        .eq("grade", grade),
      supabase
        .from("gym_durations")
        .select("gym_id, duration_minutes"),
      supabase
        .from("contest_settings")
        .select(
          "start_time, end_time, default_gym_minutes, lunch_minutes, lunch_start_time, contest_date, signup_notice, entry_fee, kakaopay_link",
        )
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("schedule_breaks")
        .select("id, name, duration_minutes, after_gym_id, display_order")
        .order("display_order"),
    ])

  const gyms = gymsRes.data ?? []
  const walls = wallsRes.data ?? []
  const totalByWall = new Map<string, number>(
    (gcRes.data ?? []).map((g) => [g.wall_id, g.total_count]),
  )
  const solvedByWall = new Map<string, number>(
    (solvesRes.data ?? []).map((s) => [s.wall_id, s.solved_count]),
  )
  const durationByGym = new Map<string, number>(
    (durRes.data ?? []).map((d) => [d.gym_id, d.duration_minutes]),
  )
  const settingsRow = settingsRes.data ?? null
  const defaultMinutes = settingsRow?.default_gym_minutes ?? 45
  const settings: ContestSettings = {
    start_time: settingsRow?.start_time ?? null,
    end_time: settingsRow?.end_time ?? null,
    default_gym_minutes: defaultMinutes,
    lunch_minutes: settingsRow?.lunch_minutes ?? 60,
    lunch_start_time: settingsRow?.lunch_start_time ?? null,
    contest_date: settingsRow?.contest_date ?? null,
    signup_notice: settingsRow?.signup_notice ?? "",
    entry_fee: settingsRow?.entry_fee ?? 10000,
    kakaopay_link: settingsRow?.kakaopay_link ?? "",
  }

  const gymsData: GymData[] = gyms.map((g) => {
    const gymWalls: WallData[] = walls
      .filter((w) => w.gym_id === g.id)
      .map((w) => ({
        id: w.id,
        name: w.name,
        display_order: w.display_order,
        total_count: totalByWall.get(w.id) ?? 0,
        solved_count: solvedByWall.get(w.id) ?? 0,
      }))

    const total_count = gymWalls.reduce((s, w) => s + w.total_count, 0)
    const solved_count = gymWalls.reduce((s, w) => s + w.solved_count, 0)

    return {
      id: g.id,
      name: g.name,
      display_order: g.display_order,
      walls: gymWalls,
      total_count,
      solved_count,
      duration_minutes: durationByGym.get(g.id) ?? defaultMinutes,
    }
  })

  const totalSolved = gymsData.reduce((s, g) => s + g.solved_count, 0)
  const totalCount = gymsData.reduce((s, g) => s + g.total_count, 0)
  const completionRate =
    totalCount > 0 ? Math.round((totalSolved / totalCount) * 100) : 0

  const breaks: ScheduleBreak[] = (breaksRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    duration_minutes: b.duration_minutes,
    after_gym_id: b.after_gym_id ?? null,
    display_order: b.display_order ?? 0,
  }))

  return {
    gyms: gymsData,
    breaks,
    totalSolved,
    totalCount,
    completionRate,
    grade,
    division: view,
    settings,
  }
}
