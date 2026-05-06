import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { loadDifficultySystem } from "@/lib/contest/grades"
import { WallsEditor } from "./WallsEditor"

export const dynamic = "force-dynamic"

export default async function AdminWallsPage() {
  await requireAdmin()
  const supabase = createServerClient()

  const [gymsRes, wallsRes, gcRes, system] = await Promise.all([
    supabase
      .from("gyms")
      .select("id, name, display_order, active")
      .order("display_order"),
    supabase
      .from("walls")
      .select("id, gym_id, name, display_order, active")
      .eq("active", true)
      .order("display_order"),
    supabase.from("grade_counts").select("wall_id, grade, total_count"),
    loadDifficultySystem(),
  ])

  // 참가 부가 푸는 색만 노출. 회색처럼 "평소 푸는 색"이지만 어떤 부도
  // solve_grade로 쓰지 않는 색은 컬럼에서 제외한다 — 운영진이 입력해야 할 수가
  // 명확하게 좁혀진다. 새 부를 추가/활성화하면 해당 색이 바로 따라 노출.
  const divisionLabelByGrade: Record<string, string> = {}
  for (const d of system.divisions) {
    if (!d.active) continue
    divisionLabelByGrade[d.solve_grade] = d.label
  }

  const visibleGrades = system.grades.filter(
    (g) => divisionLabelByGrade[g.id],
  )

  return (
    <WallsEditor
      gyms={gymsRes.data ?? []}
      walls={wallsRes.data ?? []}
      gradeCounts={gcRes.data ?? []}
      grades={visibleGrades.map((g) => ({
        key: g.id,
        label: g.label,
        color: g.color_hex,
        divisionLabel: divisionLabelByGrade[g.id] ?? "",
      }))}
    />
  )
}
