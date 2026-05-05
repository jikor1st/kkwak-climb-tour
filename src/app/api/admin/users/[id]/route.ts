import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const update: Record<string, unknown> = {}

  if (typeof body.nickname === "string") {
    const v = body.nickname.trim()
    if (!v) {
      return NextResponse.json(
        { error: "이름은 비울 수 없어요" },
        { status: 400 },
      )
    }
    if (v.length > 20) {
      return NextResponse.json({ error: "이름은 20자 이내" }, { status: 400 })
    }
    update.nickname = v
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select("id, nickname")
    .single()

  if (error) {
    console.error("[admin/users PATCH] error:", error)
    return NextResponse.json({ error: "수정 실패" }, { status: 500 })
  }

  // 참가자도 display_name 동기화
  if (typeof update.nickname === "string") {
    await supabase
      .from("participants")
      .update({ display_name: update.nickname })
      .eq("user_id", id)
  }

  return NextResponse.json({ user: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "본인 계정은 회원 관리에서 직접 삭제할 수 없어요. 내 계정 페이지에서 탈퇴하세요." },
      { status: 400 },
    )
  }

  const supabase = createServerClient()

  const { data: target, error: tErr } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle()

  if (tErr || !target) {
    return NextResponse.json({ error: "사용자를 찾을 수 없어요" }, { status: 404 })
  }

  // 마지막 어드민 보호
  if (target.role === "admin") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "마지막 어드민은 삭제할 수 없어요" },
        { status: 400 },
      )
    }
  }

  // participants는 ON DELETE CASCADE로 자동 정리 (solves도 cascade)
  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) {
    console.error("[admin/users DELETE] error:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
