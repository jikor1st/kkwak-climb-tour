import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { ParticipantList, type ParticipantRow } from "./ParticipantList"

export const dynamic = "force-dynamic"

export default async function AdminParticipantsPage() {
  await requireAdmin()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("participants")
    .select(
      "id, display_name, main_grade, category, participant_type, paid, created_at, user:users(kakao_id)",
    )
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[admin/participants] load error:", error)
  }

  const rows: ParticipantRow[] = (data ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    main_grade: p.main_grade,
    category: p.category,
    participant_type: p.participant_type,
    paid: p.paid,
    created_at: p.created_at,
  }))

  return <ParticipantList rows={rows} />
}
