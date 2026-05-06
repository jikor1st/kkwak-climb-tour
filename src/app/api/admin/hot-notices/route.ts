import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { MAX_NOTICE_LENGTH } from "@/lib/utils/notice"
import { NextResponse } from "next/server"

export async function GET() {
  await requireAdmin()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("hot_notices")
    .select("id, body, display_order, created_at, updated_at")
    .order("display_order")
    .order("created_at")

  if (error) {
    console.error("[hot-notices GET] error:", error)
    return NextResponse.json({ error: "불러오기 실패" }, { status: 500 })
  }
  return NextResponse.json({ notices: data ?? [] })
}

export async function POST(req: Request) {
  await requireAdmin()
  const body = (await req.json().catch(() => ({}))) as { body?: unknown }

  if (typeof body.body !== "string" || body.body.trim().length === 0) {
    return NextResponse.json({ error: "본문이 비어있어요" }, { status: 400 })
  }

  const text = body.body.slice(0, MAX_NOTICE_LENGTH)
  const supabase = createServerClient()

  // display_order는 default 0으로 두고 created_at으로 tie-break.
  // 새 행은 자연히 가장 마지막에 위치.
  const { data, error } = await supabase
    .from("hot_notices")
    .insert({ body: text })
    .select("id, body, display_order, created_at, updated_at")
    .single()

  if (error) {
    console.error("[hot-notices POST] error:", error)
    return NextResponse.json({ error: "추가 실패" }, { status: 500 })
  }

  return NextResponse.json({ notice: data })
}
