import { requireAdmin } from "@/lib/auth/guards"
import { loadDifficultySystem } from "@/lib/contest/grades"
import { DifficultyEditor } from "./DifficultyEditor"

export const dynamic = "force-dynamic"

export default async function AdminDifficultyPage() {
  await requireAdmin()
  const system = await loadDifficultySystem()

  return (
    <DifficultyEditor
      grades={system.grades}
      rankingGroups={system.rankingGroups}
      divisions={system.divisions}
      recommendations={system.recommendations}
    />
  )
}
