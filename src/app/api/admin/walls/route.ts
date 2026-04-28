import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const { gym_id, name } = body as { gym_id?: string; name?: string }

  if (!gym_id || !name?.trim()) {
    return NextResponse.json({ error: "gym_id, name required" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: max } = await supabase
    .from("walls")
    .select("display_order")
    .eq("gym_id", gym_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (max?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from("walls")
    .insert({
      gym_id,
      name: name.trim(),
      display_order: nextOrder,
      active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "같은 이름의 벽이 이미 있어요" },
        { status: 409 },
      )
    }
    console.error("[admin/walls] insert error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }

  return NextResponse.json({ wall: data })
}
