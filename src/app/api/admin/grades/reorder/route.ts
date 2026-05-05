import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// body: { ids: string[] } — 순서대로 sort_order 1, 2, 3, ...
export async function PUT(req: Request) {
  await requireAdmin()
  const body = await req.json()
  const ids: unknown = body.ids
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  }
  const list = (ids as unknown[]).filter(
    (x): x is string => typeof x === "string",
  )

  const supabase = createServerClient()
  for (let i = 0; i < list.length; i++) {
    const { error } = await supabase
      .from("grades")
      .update({ sort_order: i + 1 })
      .eq("id", list[i])
    if (error) {
      console.error("[admin/grades/reorder] error:", error)
      return NextResponse.json({ error: "저장 실패" }, { status: 500 })
    }
  }
  return NextResponse.json({ success: true })
}
