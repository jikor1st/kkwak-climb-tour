import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const CATEGORY_TO_GRADE: Record<string, string> = {
  advanced: "red",
  intermediate: "blue",
  beginner: "green",
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const participant = session?.user?.participant

    if (!session?.user?.id || !participant) {
      return NextResponse.json(
        { error: "참가 신청이 필요합니다" },
        { status: 401 },
      )
    }

    const body = await req.json()
    const { wall_id, grade, solved_count } = body as {
      wall_id?: string
      grade?: string
      solved_count?: number
    }

    if (!wall_id || !grade || typeof solved_count !== "number") {
      return NextResponse.json(
        { error: "잘못된 요청입니다" },
        { status: 400 },
      )
    }

    const expectedGrade = CATEGORY_TO_GRADE[participant.category]
    if (grade !== expectedGrade) {
      return NextResponse.json(
        { error: "본인 카테고리에 해당하는 색만 기록할 수 있습니다" },
        { status: 403 },
      )
    }

    const supabase = createServerClient()

    const { data: gc, error: gcError } = await supabase
      .from("grade_counts")
      .select("total_count")
      .eq("wall_id", wall_id)
      .eq("grade", grade)
      .maybeSingle()

    if (gcError) {
      console.error("[solves] grade_counts lookup error:", gcError)
      return NextResponse.json({ error: "벽 정보를 불러올 수 없습니다" }, { status: 500 })
    }

    const total = gc?.total_count ?? 0
    const capped = Math.max(0, Math.min(Math.floor(solved_count), total))

    const { error: upsertError } = await supabase
      .from("solves")
      .upsert(
        {
          participant_id: participant.id,
          wall_id,
          grade,
          solved_count: capped,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "participant_id,wall_id,grade" },
      )

    if (upsertError) {
      console.error("[solves] upsert error:", upsertError)
      return NextResponse.json(
        { error: "기록 저장에 실패했습니다" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, solved_count: capped, total })
  } catch (error) {
    console.error("[solves] api error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    )
  }
}
