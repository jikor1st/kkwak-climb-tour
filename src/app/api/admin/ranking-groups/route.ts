import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 20) {
    return NextResponse.json({ error: "이름은 1~20자" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: max } = await supabase
    .from("ranking_groups")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (max?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from("ranking_groups")
    .insert({ name, sort_order })
    .select()
    .single()

  if (error) {
    console.error("[admin/ranking-groups POST] error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }
  return NextResponse.json({ ranking_group: data })
}
