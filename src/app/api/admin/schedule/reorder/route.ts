import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type StopRef =
  | { type: "gym"; id: string }
  | { type: "break"; id: string }

export async function POST(req: Request) {
  await requireAdmin()
  const body = (await req.json()) as { stops?: StopRef[] }
  const stops = body.stops
  if (!Array.isArray(stops) || stops.length === 0) {
    return NextResponse.json({ error: "stops 배열이 필요합니다" }, { status: 400 })
  }

  const supabase = createServerClient()

  // 1) gyms display_order: 등장 순서대로 1,2,3,...
  const gymStops = stops.filter((s): s is StopRef & { type: "gym" } => s.type === "gym")
  for (let i = 0; i < gymStops.length; i++) {
    const { error } = await supabase
      .from("gyms")
      .update({ display_order: i + 1 })
      .eq("id", gymStops[i].id)
    if (error) {
      console.error("[reorder] gym order error:", error)
      return NextResponse.json({ error: "지점 순서 저장 실패" }, { status: 500 })
    }
  }

  // 2) breaks: 가장 최근 등장한 gym 뒤에 붙음 (없으면 null = 맨 처음)
  let lastGymId: string | null = null
  const breakOrderByAfter = new Map<string | null, number>()
  for (const s of stops) {
    if (s.type === "gym") {
      lastGymId = s.id
      continue
    }
    const order = breakOrderByAfter.get(lastGymId) ?? 0
    breakOrderByAfter.set(lastGymId, order + 1)
    const { error } = await supabase
      .from("schedule_breaks")
      .update({ after_gym_id: lastGymId, display_order: order })
      .eq("id", s.id)
    if (error) {
      console.error("[reorder] break update error:", error)
      return NextResponse.json({ error: "쉬는 시간 위치 저장 실패" }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
