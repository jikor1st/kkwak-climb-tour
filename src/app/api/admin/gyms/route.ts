import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await requireAdmin()
  const body = (await req.json()) as { name?: string }
  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: max } = await supabase
    .from("gyms")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (max?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from("gyms")
    .insert({ name, display_order: nextOrder, active: true })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "같은 이름의 지점이 이미 있어요" },
        { status: 409 },
      )
    }
    console.error("[admin/gyms] insert error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }

  return NextResponse.json({ gym: data })
}
