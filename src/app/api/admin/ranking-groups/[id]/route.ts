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
  if (typeof body.name === "string") {
    const v = body.name.trim()
    if (!v || v.length > 20) {
      return NextResponse.json({ error: "이름은 1~20자" }, { status: 400 })
    }
    update.name = v
  }
  if (typeof body.sort_order === "number") {
    update.sort_order = Math.floor(body.sort_order)
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("ranking_groups")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("[admin/ranking-groups PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }
  return NextResponse.json({ ranking_group: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  const { count } = await supabase
    .from("divisions")
    .select("id", { count: "exact", head: true })
    .eq("ranking_group_id", id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "이 그룹에 속한 부가 있어요. 먼저 부의 그룹을 다른 곳으로 옮기세요.",
      },
      { status: 409 },
    )
  }

  const { error } = await supabase
    .from("ranking_groups")
    .delete()
    .eq("id", id)
  if (error) {
    console.error("[admin/ranking-groups DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
