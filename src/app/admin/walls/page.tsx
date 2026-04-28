import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { WallsEditor } from "./WallsEditor"

export const dynamic = "force-dynamic"

export default async function AdminWallsPage() {
  await requireAdmin()
  const supabase = createServerClient()

  const [gymsRes, wallsRes, gcRes] = await Promise.all([
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
  ])

  return (
    <WallsEditor
      gyms={gymsRes.data ?? []}
      walls={wallsRes.data ?? []}
      gradeCounts={gcRes.data ?? []}
    />
  )
}
