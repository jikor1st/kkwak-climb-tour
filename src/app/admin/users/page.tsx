import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { UserList, type UserRow } from "./UserList"

export const dynamic = "force-dynamic"

type RawUser = {
  id: string
  kakao_id: string
  nickname: string
  role: string
  created_at: string
  participant: {
    id: string
    display_name: string
    paid: boolean
  }[] | null
}

export default async function AdminUsersPage() {
  const session = await requireAdmin()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, kakao_id, nickname, role, created_at, participant:participants(id, display_name, paid)",
    )
    .order("created_at", { ascending: false })
    .returns<RawUser[]>()

  if (error) {
    console.error("[admin/users] load error:", error)
  }

  const rows: UserRow[] = (data ?? []).map((u) => ({
    id: u.id,
    kakao_id: u.kakao_id,
    nickname: u.nickname,
    role: u.role === "admin" ? "admin" : "participant",
    created_at: u.created_at,
    participant: u.participant?.[0]
      ? {
          id: u.participant[0].id,
          display_name: u.participant[0].display_name,
          paid: !!u.participant[0].paid,
        }
      : null,
  }))

  return <UserList rows={rows} currentUserId={session.user.id} />
}
