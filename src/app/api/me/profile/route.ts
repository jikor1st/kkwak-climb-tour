import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const update: Record<string, unknown> = {}

  if (typeof body.nickname === "string") {
    const v = body.nickname.trim()
    if (!v) {
      return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 })
    }
    if (v.length > 20) {
      return NextResponse.json({ error: "이름은 20자 이내" }, { status: 400 })
    }
    update.nickname = v
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", session.user.id)
    .select("id, nickname")
    .single()

  if (error) {
    console.error("[me/profile PATCH] error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  // 참가자가 있으면 display_name 같이 동기화 (단일 이름 모델)
  if (typeof update.nickname === "string") {
    await supabase
      .from("participants")
      .update({ display_name: update.nickname })
      .eq("user_id", session.user.id)
  }

  return NextResponse.json({ user: data })
}
