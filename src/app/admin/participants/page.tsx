import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { loadDifficultySystem } from "@/lib/contest/grades"
import { ParticipantList, type ParticipantRow } from "./ParticipantList"

export const dynamic = "force-dynamic"

type ParticipantWithUser = {
  id: string
  display_name: string
  main_grade: string
  division_id: string
  participant_type: string
  paid: boolean
  created_at: string
  user: { id: string; kakao_id: string; role: string } | null
}

export default async function AdminParticipantsPage() {
  const session = await requireAdmin()
  const supabase = createServerClient()

  const [partsRes, system] = await Promise.all([
    supabase
      .from("participants")
      .select(
        "id, display_name, main_grade, division_id, participant_type, paid, created_at, user:users(id, kakao_id, role)",
      )
      .order("created_at", { ascending: true })
      .returns<ParticipantWithUser[]>(),
    loadDifficultySystem(),
  ])

  if (partsRes.error) {
    console.error("[admin/participants] load error:", partsRes.error)
  }

  const rows: ParticipantRow[] = (partsRes.data ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    main_grade: p.main_grade,
    division_id: p.division_id,
    participant_type: p.participant_type,
    paid: p.paid,
    created_at: p.created_at,
    user_id: p.user?.id ?? "",
    role: p.user?.role === "admin" ? "admin" : "participant",
  }))

  return (
    <ParticipantList
      rows={rows}
      currentUserId={session.user.id}
      grades={system.grades}
      divisions={system.divisions}
    />
  )
}
