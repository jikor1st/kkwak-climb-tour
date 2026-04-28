import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await ctx.params
  const body = (await req.json()) as {
    name?: string
    active?: boolean
    display_order?: number
  }

  const updates: Record<string, string | number | boolean> = {}
  if (typeof body.name === "string") {
    const trimmed = body.name.trim()
    if (!trimmed) {
      return NextResponse.json(
        { error: "이름은 비울 수 없어요" },
        { status: 400 },
      )
    }
    updates.name = trimmed
  }
  if (typeof body.active === "boolean") updates.active = body.active
  if (typeof body.display_order === "number" && Number.isFinite(body.display_order)) {
    updates.display_order = Math.round(body.display_order)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("gyms")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "같은 이름의 지점이 이미 있어요" },
        { status: 409 },
      )
    }
    console.error("[admin/gyms] update error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }

  return NextResponse.json({ gym: data })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await ctx.params
  const supabase = createServerClient()

  const { count } = await supabase
    .from("walls")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "이 지점에 등록된 벽이 있어 완전 삭제할 수 없어요. 비활성으로 전환해주세요.",
      },
      { status: 409 },
    )
  }

  const { error } = await supabase.from("gyms").delete().eq("id", id)
  if (error) {
    console.error("[admin/gyms] delete error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
