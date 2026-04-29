import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ROLES = new Set(["admin", "participant"])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (typeof body.role !== "string" || !ROLES.has(body.role)) {
    return NextResponse.json({ error: "잘못된 권한 값이에요" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .select("user_id")
    .eq("id", id)
    .single()

  if (pErr || !participant) {
    return NextResponse.json({ error: "참가자를 찾을 수 없어요" }, { status: 404 })
  }

  if (participant.user_id === session.user.id) {
    return NextResponse.json(
      { error: "본인 권한은 본인이 변경할 수 없어요" },
      { status: 400 },
    )
  }

  if (body.role === "participant") {
    const { count, error: cErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (cErr) {
      console.error("[admin/participants/role PATCH] count error:", cErr)
      return NextResponse.json({ error: "권한 변경 실패" }, { status: 500 })
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "마지막 어드민은 해제할 수 없어요" },
        { status: 400 },
      )
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role: body.role })
    .eq("id", participant.user_id)
    .select("id, role")
    .single()

  if (error) {
    console.error("[admin/participants/role PATCH] error:", error)
    return NextResponse.json({ error: "권한 변경 실패" }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
