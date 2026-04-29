import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MAX_LEN = 1000

export async function PATCH(req: Request) {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))

  if (typeof body.signup_notice !== "string") {
    return NextResponse.json({ error: "잘못된 요청이에요" }, { status: 400 })
  }
  if (body.signup_notice.length > MAX_LEN) {
    return NextResponse.json(
      { error: `안내문구는 ${MAX_LEN}자 이내로` },
      { status: 400 },
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("contest_settings")
    .update({ signup_notice: body.signup_notice })
    .eq("id", 1)
    .select("signup_notice")
    .single()

  if (error) {
    console.error("[admin/notice PATCH] error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  return NextResponse.json({ signup_notice: data.signup_notice })
}
