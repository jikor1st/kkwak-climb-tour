export type ScheduleSettings = {
  start_time: string | null
  end_time: string | null
  default_gym_minutes: number
  lunch_minutes: number
  lunch_start_time: string | null
  contest_date: string | null
}

export type ScheduleGym = {
  id: string
  name: string
  display_order: number
  duration_minutes: number
}

export type TimelineGymStop = {
  type: "gym"
  gymId: string
  name: string
  start: string
  end: string
  durationMinutes: number
}

export type TimelineLunchStop = {
  type: "lunch"
  start: string
  end: string
  durationMinutes: number
}

export type TimelineStop = TimelineGymStop | TimelineLunchStop

export type Timeline = {
  startLabel: string | null
  endLabel: string | null
  computedEndLabel: string | null
  stops: TimelineStop[]
  hasStartTime: boolean
}

const HHMM_RE = /^(\d{2}):(\d{2})/

function toMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null
  const m = HHMM_RE.exec(hhmm)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  return h * 60 + min
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function buildTimeline(
  settings: ScheduleSettings,
  gyms: ScheduleGym[],
): Timeline {
  const startMin = toMinutes(settings.start_time)
  const endMin = toMinutes(settings.end_time)
  const lunchStartMin = toMinutes(settings.lunch_start_time)
  const lunchMinutes = settings.lunch_minutes ?? 0

  const startLabel = startMin != null ? fromMinutes(startMin) : null
  const endLabel = endMin != null ? fromMinutes(endMin) : null

  if (startMin == null) {
    return {
      startLabel,
      endLabel,
      computedEndLabel: null,
      stops: [],
      hasStartTime: false,
    }
  }

  const ordered = [...gyms].sort((a, b) => a.display_order - b.display_order)
  const stops: TimelineStop[] = []
  let cursor = startMin
  let lunchInserted = false

  for (const gym of ordered) {
    if (
      !lunchInserted &&
      lunchStartMin != null &&
      lunchMinutes > 0 &&
      cursor >= lunchStartMin
    ) {
      const lunchStart = Math.max(cursor, lunchStartMin)
      stops.push({
        type: "lunch",
        start: fromMinutes(lunchStart),
        end: fromMinutes(lunchStart + lunchMinutes),
        durationMinutes: lunchMinutes,
      })
      cursor = lunchStart + lunchMinutes
      lunchInserted = true
    }

    const duration =
      gym.duration_minutes && gym.duration_minutes > 0
        ? gym.duration_minutes
        : settings.default_gym_minutes
    const stopStart = cursor
    cursor = stopStart + duration
    stops.push({
      type: "gym",
      gymId: gym.id,
      name: gym.name,
      start: fromMinutes(stopStart),
      end: fromMinutes(cursor),
      durationMinutes: duration,
    })
  }

  return {
    startLabel,
    endLabel,
    computedEndLabel: fromMinutes(cursor),
    stops,
    hasStartTime: true,
  }
}

export function formatHHMM(value: string | null | undefined): string | null {
  const m = toMinutes(value ?? null)
  return m == null ? null : fromMinutes(m)
}
