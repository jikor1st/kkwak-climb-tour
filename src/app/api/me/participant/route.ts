import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 본인 참가 신청만 취소 (회원/카카오 계정은 그대로 유지).
// participants 행을 삭제하면 solves는 FK CASCADE로 자동 정리.
// 다시 참가하고 싶으면 /signup에서 새로 등록.
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data: participant, error: findErr } = await supabase
    .from("participants")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle()

  if (findErr) {
    console.error("[me/participant DELETE] find error:", findErr)
    return NextResponse.json({ error: "조회 실패" }, { status: 500 })
  }

  if (!participant) {
    return NextResponse.json(
      { error: "취소할 참가 신청이 없어요" },
      { status: 404 },
    )
  }

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participant.id)

  if (error) {
    console.error("[me/participant DELETE] error:", error)
    return NextResponse.json({ error: "참가 취소 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
