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
    duration_minutes?: number
    after_gym_id?: string | null
    display_order?: number
  }

  const updates: Record<string, string | number | null> = {}
  if (typeof body.name === "string") {
    const n = body.name.trim()
    if (!n) {
      return NextResponse.json({ error: "이름은 비울 수 없어요" }, { status: 400 })
    }
    updates.name = n
  }
  if (typeof body.duration_minutes === "number") {
    const d = Math.round(body.duration_minutes)
    if (!Number.isFinite(d) || d < 0 || d > 600) {
      return NextResponse.json({ error: "분(0~600)을 입력해주세요" }, { status: 400 })
    }
    updates.duration_minutes = d
  }
  if ("after_gym_id" in body) {
    updates.after_gym_id = body.after_gym_id ?? null
  }
  if (typeof body.display_order === "number" && Number.isFinite(body.display_order)) {
    updates.display_order = Math.round(body.display_order)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("schedule_breaks")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[admin/schedule-breaks] update error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }
  return NextResponse.json({ break: data })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await ctx.params
  const supabase = createServerClient()
  const { error } = await supabase.from("schedule_breaks").delete().eq("id", id)
  if (error) {
    console.error("[admin/schedule-breaks] delete error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
