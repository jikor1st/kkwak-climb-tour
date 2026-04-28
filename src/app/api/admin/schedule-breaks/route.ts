import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await requireAdmin()
  const body = (await req.json()) as {
    name?: string
    duration_minutes?: number
    after_gym_id?: string | null
    display_order?: number
  }

  const name = body.name?.trim()
  const duration =
    typeof body.duration_minutes === "number" ? Math.round(body.duration_minutes) : NaN

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 })
  }
  if (!Number.isFinite(duration) || duration < 0 || duration > 600) {
    return NextResponse.json({ error: "분(0~600)을 입력해주세요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("schedule_breaks")
    .insert({
      name,
      duration_minutes: duration,
      after_gym_id: body.after_gym_id ?? null,
      display_order: body.display_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[admin/schedule-breaks] insert error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }
  return NextResponse.json({ break: data })
}
