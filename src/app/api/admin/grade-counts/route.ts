import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_GRADES = new Set(["red", "blue", "green"])

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const { wall_id, grade, total_count } = body as {
    wall_id?: string
    grade?: string
    total_count?: number
  }

  if (
    !wall_id ||
    !grade ||
    !ALLOWED_GRADES.has(grade) ||
    typeof total_count !== "number"
  ) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  }

  const value = Math.max(0, Math.min(Math.floor(total_count), 999))

  const supabase = createServerClient()
  const { error } = await supabase.from("grade_counts").upsert(
    {
      wall_id,
      grade,
      total_count: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "wall_id,grade" },
  )

  if (error) {
    console.error("[admin/grade-counts] upsert error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true, total_count: value })
}
