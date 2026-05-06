import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { MAX_NOTICE_LENGTH } from "@/lib/utils/notice"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { body?: unknown }

  if (typeof body.body !== "string" || body.body.trim().length === 0) {
    return NextResponse.json({ error: "본문이 비어있어요" }, { status: 400 })
  }

  const text = body.body.slice(0, MAX_NOTICE_LENGTH)
  const supabase = createServerClient()

  // 같은 텍스트 재저장은 updated_at을 건드리지 않아 dismiss 상태를 유지.
  const { data: prev } = await supabase
    .from("hot_notices")
    .select("body")
    .eq("id", id)
    .maybeSingle()

  if (!prev) {
    return NextResponse.json({ error: "공지를 찾을 수 없어요" }, { status: 404 })
  }

  const updates: Record<string, string> = { body: text }
  if (prev.body.trim() !== text.trim()) {
    updates.updated_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("hot_notices")
    .update(updates)
    .eq("id", id)
    .select("id, body, display_order, created_at, updated_at")
    .single()

  if (error) {
    console.error("[hot-notices PATCH] error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  return NextResponse.json({ notice: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from("hot_notices").delete().eq("id", id)

  if (error) {
    console.error("[hot-notices DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
