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

  const usedGradeIds = new Set(system.divisions.map((d) => d.solve_grade))
  const usedGrades = system.grades.filter((g) => usedGradeIds.has(g.id))
  const divisionLabelByGrade: Record<string, string> = {}
  for (const d of system.divisions) {
    divisionLabelByGrade[d.solve_grade] = d.label
  }

  return (
    <WallsEditor
      gyms={gymsRes.data ?? []}
      walls={wallsRes.data ?? []}
      gradeCounts={gcRes.data ?? []}
      grades={usedGrades.map((g) => ({
        key: g.id,
        label: g.label,
        color: g.color_hex,
        divisionLabel: divisionLabelByGrade[g.id] ?? "",
      }))}
    />
  )
}
