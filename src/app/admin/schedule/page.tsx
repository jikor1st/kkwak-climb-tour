import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { ScheduleEditor } from "./ScheduleEditor"

export const dynamic = "force-dynamic"

export default async function AdminSchedulePage() {
  await requireAdmin()
  const supabase = createServerClient()

  const [settingsRes, gymsRes, durRes, breaksRes] = await Promise.all([
    supabase
      .from("contest_settings")
      .select(
        "contest_date, start_time, end_time, default_gym_minutes, lunch_minutes, lunch_start_time",
      )
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("gyms")
      .select("id, name, display_order")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("gym_durations")
      .select("gym_id, duration_minutes"),
    supabase
      .from("schedule_breaks")
      .select("id, name, duration_minutes, after_gym_id, display_order")
      .order("display_order"),
  ])

  const row = settingsRes.data
  const settings = {
    start_time: row?.start_time ?? null,
    end_time: row?.end_time ?? null,
    default_gym_minutes: row?.default_gym_minutes ?? 45,
    lunch_minutes: row?.lunch_minutes ?? 60,
    lunch_start_time: row?.lunch_start_time ?? null,
    contest_date: row?.contest_date ?? null,
  }

  const durMap = new Map(
    (durRes.data ?? []).map((d) => [d.gym_id, d.duration_minutes]),
  )
  const gyms = (gymsRes.data ?? []).map((g) => ({
    ...g,
    duration_minutes: durMap.get(g.id) ?? settings.default_gym_minutes,
  }))

  const breaks = (breaksRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    duration_minutes: b.duration_minutes,
    after_gym_id: b.after_gym_id ?? null,
    display_order: b.display_order ?? 0,
  }))

  return <ScheduleEditor settings={settings} gyms={gyms} breaks={breaks} />
}
