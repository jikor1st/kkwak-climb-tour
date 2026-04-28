import type { Timeline, TimelineStop } from "./schedule"

export type CurrentStatus =
  | { kind: "no-schedule" }
  | {
      kind: "before"
      minutesUntilStart: number
      firstStop: TimelineStop
    }
  | {
      kind: "active"
      stop: TimelineStop
      next: TimelineStop | null
      elapsedMin: number
      remainingMin: number
      stopIndex: number
    }
  | { kind: "after"; endLabel: string | null }

const TIME_RE = /^(\d{2}):(\d{2})/

function parseHHMM(value: string): number | null {
  const m = TIME_RE.exec(value)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function nowMinutesKST(date: Date = new Date()): number {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000
  const kst = new Date(utc + 9 * 60 * 60_000)
  return kst.getHours() * 60 + kst.getMinutes()
}

export function todayDateStringKST(date: Date = new Date()): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000
  const kst = new Date(utc + 9 * 60 * 60_000)
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(
    kst.getDate(),
  ).padStart(2, "0")}`
}

export function computeCurrentStatus(
  timeline: Timeline,
  nowMin: number,
): CurrentStatus {
  if (!timeline.hasStartTime || timeline.stops.length === 0) {
    return { kind: "no-schedule" }
  }

  const firstStop = timeline.stops[0]
  const firstStart = parseHHMM(firstStop.start)
  if (firstStart == null) return { kind: "no-schedule" }

  if (nowMin < firstStart) {
    return {
      kind: "before",
      minutesUntilStart: firstStart - nowMin,
      firstStop,
    }
  }

  for (let i = 0; i < timeline.stops.length; i++) {
    const stop = timeline.stops[i]
    const start = parseHHMM(stop.start)
    const end = parseHHMM(stop.end)
    if (start == null || end == null) continue
    if (start <= nowMin && nowMin < end) {
      return {
        kind: "active",
        stop,
        next: timeline.stops[i + 1] ?? null,
        elapsedMin: nowMin - start,
        remainingMin: end - nowMin,
        stopIndex: i,
      }
    }
  }

  return {
    kind: "after",
    endLabel: timeline.endLabel ?? timeline.computedEndLabel,
  }
}

export function formatDurationShort(mins: number): string {
  if (mins < 1) return "곧"
  if (mins < 60) return `${mins}분`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
