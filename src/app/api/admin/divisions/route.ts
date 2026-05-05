import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const label = typeof body.label === "string" ? body.label.trim() : ""
  const solve_grade =
    typeof body.solve_grade === "string" ? body.solve_grade.trim() : ""
  const ranking_group_id =
    typeof body.ranking_group_id === "string" ? body.ranking_group_id : null
  const desc_text = typeof body.desc_text === "string" ? body.desc_text : ""

  if (!label || label.length > 20) {
    return NextResponse.json({ error: "이름은 1~20자" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: gradeRow } = await supabase
    .from("grades")
    .select("id")
    .eq("id", solve_grade)
    .maybeSingle()
  if (!gradeRow) {
    return NextResponse.json({ error: "잘못된 색입니다" }, { status: 400 })
  }

  if (ranking_group_id) {
    const { data: g } = await supabase
      .from("ranking_groups")
      .select("id")
      .eq("id", ranking_group_id)
      .maybeSingle()
    if (!g) {
      return NextResponse.json(
        { error: "잘못된 랭킹 그룹입니다" },
        { status: 400 },
      )
    }
  }

  const { data: max } = await supabase
    .from("divisions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (max?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from("divisions")
    .insert({
      label,
      solve_grade,
      ranking_group_id,
      desc_text,
      sort_order,
      active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[admin/divisions POST] error:", error)
    return NextResponse.json({ error: "생성 실패" }, { status: 500 })
  }
  return NextResponse.json({ division: data })
}
