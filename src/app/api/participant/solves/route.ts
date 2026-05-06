import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { isContestOpen } from "@/lib/contest/timeline-now"
import { buildTimeline } from "@/lib/contest/schedule"
import { NextResponse } from "next/server"

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

    if (!participant.paid) {
      return NextResponse.json(
        { error: "입금 확인 후 기록할 수 있어요" },
        { status: 403 },
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

    const supabase = createServerClient()

    const { data: division, error: divError } = await supabase
      .from("divisions")
      .select("solve_grade")
      .eq("id", participant.division_id)
      .maybeSingle()

    if (divError || !division) {
      return NextResponse.json(
        { error: "참가 부 정보를 찾을 수 없습니다" },
        { status: 500 },
      )
    }

    if (grade !== division.solve_grade) {
      return NextResponse.json(
        { error: "본인 부에 해당하는 색만 기록할 수 있습니다" },
        { status: 403 },
      )
    }

    const [settingsRes, gymsRes, durRes, breaksRes] = await Promise.all([
      supabase
        .from("contest_settings")
        .select(
          "contest_date, start_time, default_gym_minutes, lunch_minutes, lunch_start_time",
        )
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("gyms")
        .select("id, name, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase.from("gym_durations").select("gym_id, duration_minutes"),
      supabase
        .from("schedule_breaks")
        .select("id, name, duration_minutes, after_gym_id, display_order")
        .order("display_order"),
    ])
    const settings = settingsRes.data
    const defaultMinutes = settings?.default_gym_minutes ?? 45
    const durMap = new Map(
      (durRes.data ?? []).map((d) => [d.gym_id, d.duration_minutes]),
    )
    const timelineGyms = (gymsRes.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      display_order: g.display_order,
      duration_minutes: durMap.get(g.id) ?? defaultMinutes,
    }))
    const breaks = (breaksRes.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      duration_minutes: b.duration_minutes,
      after_gym_id: b.after_gym_id ?? null,
      display_order: b.display_order ?? 0,
    }))
    const timeline = buildTimeline(
      {
        start_time: settings?.start_time ?? null,
        default_gym_minutes: defaultMinutes,
        lunch_minutes: settings?.lunch_minutes ?? 60,
        lunch_start_time: settings?.lunch_start_time ?? null,
        contest_date: settings?.contest_date ?? null,
      },
      timelineGyms,
      breaks,
    )

    const window = isContestOpen(
      {
        contest_date: settings?.contest_date ?? null,
        start_time: settings?.start_time ?? null,
      },
      timeline.endLabel,
    )

    if (!window.open) {
      return NextResponse.json(
        { error: window.reason ?? "지금은 기록할 수 없어요" },
        { status: 403 },
      )
    }

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
