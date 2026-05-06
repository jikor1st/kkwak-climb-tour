import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { MAX_NOTICE_LENGTH } from "@/lib/utils/notice"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  await requireAdmin()
  const body = (await req.json().catch(() => ({}))) as { pinned_notice?: unknown }

  if (typeof body.pinned_notice !== "string") {
    return NextResponse.json({ error: "pinned_notice 누락" }, { status: 400 })
  }

  const next = body.pinned_notice.slice(0, MAX_NOTICE_LENGTH)
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("contest_settings")
    .update({ pinned_notice: next })
    .eq("id", 1)
    .select("pinned_notice")
    .single()

  if (error) {
    console.error("[admin/announcement PATCH] error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  return NextResponse.json(data)
}
