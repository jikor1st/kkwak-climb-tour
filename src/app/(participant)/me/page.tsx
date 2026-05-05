import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { MeForm } from "./MeForm"

export const dynamic = "force-dynamic"

export default async function MePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("id, nickname, role, kakao_id, created_at")
    .eq("id", session.user.id)
    .maybeSingle()

  if (!user) {
    redirect("/login")
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id, display_name, paid")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <MeForm
      user={{
        id: user.id,
        nickname: user.nickname ?? "",
        role: user.role === "admin" ? "admin" : "participant",
        kakao_id: user.kakao_id,
        created_at: user.created_at,
      }}
      participant={
        participant
          ? {
              id: participant.id,
              display_name: participant.display_name,
              paid: !!participant.paid,
            }
          : null
      }
    />
  )
}
