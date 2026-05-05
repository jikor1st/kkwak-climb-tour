import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const supabase = createServerClient()

  // 본인이 마지막 어드민이면 탈퇴 불가
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (me?.role === "admin") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        {
          error:
            "본인이 마지막 어드민이라 탈퇴할 수 없어요. 다른 어드민을 먼저 지정해주세요.",
        },
        { status: 400 },
      )
    }
  }

  // participants/solves는 FK CASCADE로 자동 정리
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", session.user.id)

  if (error) {
    console.error("[me DELETE] error:", error)
    return NextResponse.json({ error: "탈퇴 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
