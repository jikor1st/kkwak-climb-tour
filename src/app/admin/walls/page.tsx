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

  // 모든 색을 노출 — 색을 새로 추가하면 그 즉시 벽별 문제 수 입력 컬럼이
  // 따라온다. 부(division)가 아직 그 색을 안 풀어도 색만 단독으로 등록 가능.
  const divisionLabelByGrade: Record<string, string> = {}
  for (const d of system.divisions) {
    divisionLabelByGrade[d.solve_grade] = d.label
  }

  return (
    <WallsEditor
      gyms={gymsRes.data ?? []}
      walls={wallsRes.data ?? []}
      gradeCounts={gcRes.data ?? []}
      grades={system.grades.map((g) => ({
        key: g.id,
        label: g.label,
        color: g.color_hex,
        divisionLabel: divisionLabelByGrade[g.id] ?? "",
      }))}
    />
  )
}
