import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function PostLoginPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // 회원 프로필 — 이름이 비어있으면 강제로 이름 입력
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", session.user.id)
    .maybeSingle()

  if (!user?.nickname?.trim()) {
    redirect("/onboarding/name")
  }

  if (session.user.participant) {
    redirect("/dashboard")
  }

  redirect("/signup")
}
