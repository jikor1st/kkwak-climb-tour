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

  if (typeof body.paid === "boolean") update.paid = body.paid
  if (typeof body.category === "string" && body.category) {
    update.category = body.category
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
