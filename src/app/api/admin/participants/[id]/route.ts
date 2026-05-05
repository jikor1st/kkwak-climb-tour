import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const TYPES = new Set(["crew", "guest"])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}
  const supabase = createServerClient()

  if (typeof body.paid === "boolean") update.paid = body.paid

  if (typeof body.division_id === "string") {
    const { data } = await supabase
      .from("divisions")
      .select("id")
      .eq("id", body.division_id)
      .maybeSingle()
    if (!data) {
      return NextResponse.json({ error: "잘못된 참가 부입니다" }, { status: 400 })
    }
    update.division_id = body.division_id
  }

  if (typeof body.main_grade === "string") {
    const { data } = await supabase
      .from("grades")
      .select("id")
      .eq("id", body.main_grade)
      .maybeSingle()
    if (!data) {
      return NextResponse.json({ error: "잘못된 도전 난이도입니다" }, { status: 400 })
    }
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
