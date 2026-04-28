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
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim()
  }
  if (typeof body.active === "boolean") update.active = body.active
  if (typeof body.display_order === "number") {
    update.display_order = body.display_order
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("walls")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "같은 이름의 벽이 이미 있어요" },
        { status: 409 },
      )
    }
    console.error("[admin/walls PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }

  return NextResponse.json({ wall: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()
  const { error } = await supabase.from("walls").delete().eq("id", id)
  if (error) {
    console.error("[admin/walls DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
