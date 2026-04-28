import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const CATEGORIES = new Set(["advanced", "intermediate", "beginner"])
const GRADES = new Set(["purple", "pink", "red", "blue"])
const TYPES = new Set(["crew", "guest"])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (typeof body.paid === "boolean") update.paid = body.paid
  if (typeof body.category === "string" && CATEGORIES.has(body.category)) {
    update.category = body.category
  }
  if (typeof body.main_grade === "string" && GRADES.has(body.main_grade)) {
    update.main_grade = body.main_grade
  }
  if (typeof body.participant_type === "string" && TYPES.has(body.participant_type)) {
    update.participant_type = body.participant_type
  }
  if (typeof body.display_name === "string") {
    const n = body.display_name.trim()
    if (!n) {
      return NextResponse.json({ error: "이름은 비울 수 없어요" }, { status: 400 })
    }
    if (n.length > 20) {
      return NextResponse.json({ error: "이름은 20자 이내로" }, { status: 400 })
    }
    update.display_name = n
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("participants")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[admin/participants PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }

  return NextResponse.json({ participant: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from("participants").delete().eq("id", id)
  if (error) {
    console.error("[admin/participants DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
