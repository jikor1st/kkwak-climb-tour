import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}
  const supabase = createServerClient()

  if (typeof body.label === "string") {
    const v = body.label.trim()
    if (!v || v.length > 20) {
      return NextResponse.json({ error: "이름은 1~20자" }, { status: 400 })
    }
    update.label = v
  }
  if (typeof body.desc_text === "string") {
    update.desc_text = body.desc_text
  }
  if (typeof body.solve_grade === "string") {
    const { data } = await supabase
      .from("grades")
      .select("id")
      .eq("id", body.solve_grade)
      .maybeSingle()
    if (!data) {
      return NextResponse.json({ error: "잘못된 색입니다" }, { status: 400 })
    }
    update.solve_grade = body.solve_grade
  }
  if ("ranking_group_id" in body) {
    if (body.ranking_group_id === null) {
      update.ranking_group_id = null
    } else if (typeof body.ranking_group_id === "string") {
      const { data } = await supabase
        .from("ranking_groups")
        .select("id")
        .eq("id", body.ranking_group_id)
        .maybeSingle()
      if (!data) {
        return NextResponse.json(
          { error: "잘못된 랭킹 그룹입니다" },
          { status: 400 },
        )
      }
      update.ranking_group_id = body.ranking_group_id
    }
  }
  if (typeof body.sort_order === "number") {
    update.sort_order = Math.floor(body.sort_order)
  }
  if (typeof body.active === "boolean") {
    update.active = body.active
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("divisions")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("[admin/divisions PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }
  return NextResponse.json({ division: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  const { count } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("division_id", id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "이 부에 참가자가 있어요. 먼저 참가자를 다른 부로 옮기세요. 또는 비활성으로만 전환하세요.",
      },
      { status: 409 },
    )
  }

  const { error } = await supabase.from("divisions").delete().eq("id", id)
  if (error) {
    console.error("[admin/divisions DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
