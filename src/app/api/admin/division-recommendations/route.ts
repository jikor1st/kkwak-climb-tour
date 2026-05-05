import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 도전 난이도(challenge_grade)별 추천 부를 한 번에 교체.
// body: { challenge_grade: string, division_ids: string[] }
export async function PUT(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const challenge_grade =
    typeof body.challenge_grade === "string" ? body.challenge_grade : ""
  const division_ids: unknown = body.division_ids

  if (!challenge_grade || !Array.isArray(division_ids)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  }

  const ids = (division_ids as unknown[]).filter(
    (x): x is string => typeof x === "string",
  )

  const supabase = createServerClient()

  const { data: gradeRow } = await supabase
    .from("grades")
    .select("id")
    .eq("id", challenge_grade)
    .maybeSingle()
  if (!gradeRow) {
    return NextResponse.json({ error: "잘못된 색입니다" }, { status: 400 })
  }

  if (ids.length > 0) {
    const { data: divs } = await supabase
      .from("divisions")
      .select("id")
      .in("id", ids)
    const found = new Set((divs ?? []).map((d) => d.id))
    for (const id of ids) {
      if (!found.has(id)) {
        return NextResponse.json(
          { error: "잘못된 부 ID가 포함되어 있습니다" },
          { status: 400 },
        )
      }
    }
  }

  const { error: delError } = await supabase
    .from("division_recommendations")
    .delete()
    .eq("challenge_grade", challenge_grade)
  if (delError) {
    console.error("[admin/division-recommendations DELETE] error:", delError)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  if (ids.length > 0) {
    const rows = ids.map((division_id) => ({ challenge_grade, division_id }))
    const { error: insError } = await supabase
      .from("division_recommendations")
      .insert(rows)
    if (insError) {
      console.error("[admin/division-recommendations INSERT] error:", insError)
      return NextResponse.json({ error: "저장 실패" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
