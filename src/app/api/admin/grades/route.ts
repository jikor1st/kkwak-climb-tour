import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ID_RE = /^[a-z][a-z0-9_-]{0,31}$/
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const id = typeof body.id === "string" ? body.id.trim().toLowerCase() : ""
  const label = typeof body.label === "string" ? body.label.trim() : ""
  const color_hex = typeof body.color_hex === "string" ? body.color_hex.trim() : ""
  const sort_order = typeof body.sort_order === "number" ? Math.floor(body.sort_order) : 0

  if (!ID_RE.test(id)) {
    return NextResponse.json(
      { error: "ID는 영문 소문자/숫자/_-만 (32자 이내)" },
      { status: 400 },
    )
  }
  if (!label || label.length > 16) {
    return NextResponse.json({ error: "이름은 1~16자" }, { status: 400 })
  }
  if (!HEX_RE.test(color_hex)) {
    return NextResponse.json(
      { error: "색은 #RRGGBB 형식이어야 합니다" },
      { status: 400 },
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("grades")
    .insert({ id, label, color_hex, sort_order })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 ID" }, { status: 409 })
    }
    console.error("[admin/grades POST] error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }

  return NextResponse.json({ grade: data })
}
