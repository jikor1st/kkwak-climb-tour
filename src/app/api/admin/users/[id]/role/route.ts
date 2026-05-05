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

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "본인 권한은 본인이 변경할 수 없어요" },
      { status: 400 },
    )
  }

  const supabase = createServerClient()

  const { data: targetUser, error: uErr } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle()

  if (uErr || !targetUser) {
    return NextResponse.json({ error: "사용자를 찾을 수 없어요" }, { status: 404 })
  }

  // 마지막 어드민은 해제 못 하게
  if (body.role === "participant" && targetUser.role === "admin") {
    const { count, error: cErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (cErr) {
      console.error("[admin/users/role PATCH] count error:", cErr)
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
    .eq("id", id)
    .select("id, role")
    .single()

  if (error) {
    console.error("[admin/users/role PATCH] error:", error)
    return NextResponse.json({ error: "권한 변경 실패" }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
