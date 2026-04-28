import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function normalizeTime(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  if (typeof value !== "string") return undefined
  return TIME_RE.test(value) ? value : undefined
}

function normalizeDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  if (typeof value !== "string") return undefined
  if (!DATE_RE.test(value)) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : value
}

function normalizeMinutes(value: unknown): number | undefined {
  if (value === undefined) return undefined
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 600) return undefined
  return Math.round(n)
}

export async function PATCH(req: Request) {
  await requireAdmin()
  const supabase = createServerClient()
  const body = (await req.json()) as {
    settings?: {
      contest_date?: string | null
      start_time?: string | null
      end_time?: string | null
      lunch_start_time?: string | null
      lunch_minutes?: number
      default_gym_minutes?: number
    }
    gym_durations?: { gym_id: string; duration_minutes: number }[]
  }

  const updates: Record<string, string | number | null> = {}
  if (body.settings) {
    const date = normalizeDate(body.settings.contest_date)
    const start = normalizeTime(body.settings.start_time)
    const end = normalizeTime(body.settings.end_time)
    const lunchStart = normalizeTime(body.settings.lunch_start_time)
    const lunchMin = normalizeMinutes(body.settings.lunch_minutes)
    const defaultMin = normalizeMinutes(body.settings.default_gym_minutes)
    if (date !== undefined && date !== null) updates.contest_date = date
    if (start !== undefined) updates.start_time = start
    if (end !== undefined) updates.end_time = end
    if (lunchStart !== undefined) updates.lunch_start_time = lunchStart
    if (lunchMin !== undefined) updates.lunch_minutes = lunchMin
    if (defaultMin !== undefined) updates.default_gym_minutes = defaultMin
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString()
    const { error } = await supabase
      .from("contest_settings")
      .update(updates)
      .eq("id", 1)
    if (error) {
      console.error("[admin/schedule] settings update error:", error)
      return NextResponse.json(
        { error: "설정 저장 실패" },
        { status: 500 },
      )
    }
  }

  if (body.gym_durations && body.gym_durations.length > 0) {
    for (const row of body.gym_durations) {
      const minutes = normalizeMinutes(row.duration_minutes)
      if (!row.gym_id || minutes === undefined) continue
      const { error } = await supabase
        .from("gym_durations")
        .update({
          duration_minutes: minutes,
          updated_at: new Date().toISOString(),
        })
        .eq("gym_id", row.gym_id)
      if (error) {
        console.error("[admin/schedule] gym_duration error:", error)
        return NextResponse.json(
          { error: "지점 체류시간 저장 실패" },
          { status: 500 },
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
