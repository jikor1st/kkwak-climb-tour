import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NameForm } from "./NameForm"

export const dynamic = "force-dynamic"

export default async function OnboardingNamePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const supabase = createServerClient()
  const [userRes, participantRes] = await Promise.all([
    supabase
      .from("users")
      .select("nickname")
      .eq("id", session.user.id)
      .maybeSingle(),
    supabase
      .from("participants")
      .select("display_name")
      .eq("user_id", session.user.id)
      .maybeSingle(),
  ])

  // 이미 이름 있으면 다음 단계로
  if (userRes.data?.nickname?.trim()) {
    if (session.user.participant) redirect("/dashboard")
    redirect("/signup")
  }

  // 우선순위: 기존 참가 신청 시 입력한 이름 → 카카오 닉네임 → 빈값
  const initial =
    participantRes.data?.display_name?.trim() ||
    session.user.name ||
    ""

  return (
    <NameForm
      initialName={initial}
      hasExistingParticipant={!!participantRes.data}
    />
  )
}
