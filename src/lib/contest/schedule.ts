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

export type ScheduleBreak = {
  id: string
  name: string
  duration_minutes: number
  after_gym_id: string | null
  display_order: number
}

export type TimelineGymStop = {
  type: "gym"
  gymId: string
  name: string
  start: string
  end: string
  durationMinutes: number
}

export type TimelineBreakStop = {
  type: "break"
  breakId: string
  name: string
  start: string
  end: string
  durationMinutes: number
}

export type TimelineStop = TimelineGymStop | TimelineBreakStop

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
  const m = ((total % 60) + 60) % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function buildTimeline(
  settings: ScheduleSettings,
  gyms: ScheduleGym[],
  breaks: ScheduleBreak[] = [],
): Timeline {
  const startMin = toMinutes(settings.start_time)
  const endMin = toMinutes(settings.end_time)

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

  const orderedGyms = [...gyms].sort((a, b) => a.display_order - b.display_order)
  const breaksByAfter = new Map<string, ScheduleBreak[]>()
  for (const b of breaks) {
    const key = b.after_gym_id ?? "__start__"
    const list = breaksByAfter.get(key) ?? []
    list.push(b)
    breaksByAfter.set(key, list)
  }
  for (const list of breaksByAfter.values()) {
    list.sort((a, b) => a.display_order - b.display_order)
  }

  const stops: TimelineStop[] = []
  let cursor = startMin

  function flushBreaks(key: string) {
    const list = breaksByAfter.get(key) ?? []
    for (const b of list) {
      const stopStart = cursor
      cursor = stopStart + b.duration_minutes
      stops.push({
        type: "break",
        breakId: b.id,
        name: b.name,
        start: fromMinutes(stopStart),
        end: fromMinutes(cursor),
        durationMinutes: b.duration_minutes,
      })
    }
  }

  flushBreaks("__start__")

  for (const gym of orderedGyms) {
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
    flushBreaks(gym.id)
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
