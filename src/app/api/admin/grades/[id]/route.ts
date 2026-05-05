import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (typeof body.label === "string") {
    const v = body.label.trim()
    if (!v || v.length > 16) {
      return NextResponse.json({ error: "이름은 1~16자" }, { status: 400 })
    }
    update.label = v
  }
  if (typeof body.color_hex === "string") {
    const v = body.color_hex.trim()
    if (!HEX_RE.test(v)) {
      return NextResponse.json(
        { error: "색은 #RRGGBB 형식이어야 합니다" },
        { status: 400 },
      )
    }
    update.color_hex = v
  }
  if (typeof body.sort_order === "number") {
    update.sort_order = Math.floor(body.sort_order)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("grades")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[admin/grades PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }
  return NextResponse.json({ grade: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  // 사용 중인지 검사
  const [partsRes, divsRes, gcRes, solvesRes, recRes] = await Promise.all([
    supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("main_grade", id),
    supabase
      .from("divisions")
      .select("id", { count: "exact", head: true })
      .eq("solve_grade", id),
    supabase
      .from("grade_counts")
      .select("id", { count: "exact", head: true })
      .eq("grade", id),
    supabase
      .from("solves")
      .select("id", { count: "exact", head: true })
      .eq("grade", id),
    supabase
      .from("division_recommendations")
      .select("division_id", { count: "exact", head: true })
      .eq("challenge_grade", id),
  ])

  const refs =
    (partsRes.count ?? 0) +
    (divsRes.count ?? 0) +
    (gcRes.count ?? 0) +
    (solvesRes.count ?? 0) +
    (recRes.count ?? 0)

  if (refs > 0) {
    return NextResponse.json(
      {
        error:
          "이 색을 사용하는 참가자/부/풀이 기록이 있어 삭제할 수 없습니다",
      },
      { status: 409 },
    )
  }

  const { error } = await supabase.from("grades").delete().eq("id", id)
  if (error) {
    console.error("[admin/grades DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
