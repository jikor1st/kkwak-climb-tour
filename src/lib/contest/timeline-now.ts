import type { Timeline, TimelineGymStop, TimelineStop } from "./schedule"

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

export type CurrentStatusSec =
  | { kind: "no-schedule" }
  | {
      kind: "before"
      secondsUntilStart: number
      firstStop: TimelineStop
    }
  | {
      kind: "active"
      stop: TimelineStop
      next: TimelineStop | null
      prevGym: TimelineGymStop | null
      nextGym: TimelineGymStop | null
      elapsedSec: number
      remainingSec: number
      totalSec: number
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

export function nowSecondsKST(date: Date = new Date()): number {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000
  const kst = new Date(utc + 9 * 60 * 60_000)
  return kst.getHours() * 3600 + kst.getMinutes() * 60 + kst.getSeconds()
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

export function formatCountdown(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`
  return `${pad(m)}:${pad(sec)}`
}

export function computeCurrentStatusSec(
  timeline: Timeline,
  nowSec: number,
): CurrentStatusSec {
  if (!timeline.hasStartTime || timeline.stops.length === 0) {
    return { kind: "no-schedule" }
  }

  const firstStop = timeline.stops[0]
  const firstStartMin = parseHHMM(firstStop.start)
  if (firstStartMin == null) return { kind: "no-schedule" }
  const firstStartSec = firstStartMin * 60

  if (nowSec < firstStartSec) {
    return {
      kind: "before",
      secondsUntilStart: firstStartSec - nowSec,
      firstStop,
    }
  }

  for (let i = 0; i < timeline.stops.length; i++) {
    const stop = timeline.stops[i]
    const startMin = parseHHMM(stop.start)
    const endMin = parseHHMM(stop.end)
    if (startMin == null || endMin == null) continue
    const startSec = startMin * 60
    const endSec = endMin * 60
    if (startSec <= nowSec && nowSec < endSec) {
      let prevGym: TimelineGymStop | null = null
      for (let j = i - 1; j >= 0; j--) {
        const s = timeline.stops[j]
        if (s.type === "gym") {
          prevGym = s
          break
        }
      }
      let nextGym: TimelineGymStop | null = null
      for (let j = i + 1; j < timeline.stops.length; j++) {
        const s = timeline.stops[j]
        if (s.type === "gym") {
          nextGym = s
          break
        }
      }
      return {
        kind: "active",
        stop,
        next: timeline.stops[i + 1] ?? null,
        prevGym,
        nextGym,
        elapsedSec: nowSec - startSec,
        remainingSec: endSec - nowSec,
        totalSec: endSec - startSec,
        stopIndex: i,
      }
    }
  }

  return {
    kind: "after",
    endLabel: timeline.endLabel ?? timeline.computedEndLabel,
  }
}

const WEEKDAY_KO_FULL = ["일", "월", "화", "수", "목", "금", "토"]

function formatPrettyDate(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAY_KO_FULL[d.getDay()]})`
}

export type ContestWindow = {
  open: boolean
  reason: string | null
}

type WindowSettings = {
  contest_date: string | null
  start_time: string | null
  end_time: string | null
}

export function isContestOpen(
  settings: WindowSettings,
  now: Date = new Date(),
): ContestWindow {
  if (!settings.contest_date) {
    return { open: false, reason: "대회 일정이 아직 등록되지 않았어요" }
  }
  if (!settings.start_time) {
    return { open: false, reason: "대회 시작 시각이 아직 등록되지 않았어요" }
  }

  const today = todayDateStringKST(now)
  const nowMin = nowMinutesKST(now)

  if (today < settings.contest_date) {
    return {
      open: false,
      reason: `${formatPrettyDate(settings.contest_date)} ${settings.start_time}에 시작합니다`,
    }
  }

  if (today > settings.contest_date) {
    return { open: false, reason: "대회가 종료되었어요" }
  }

  const startMin = Number(settings.start_time.slice(0, 2)) * 60 + Number(settings.start_time.slice(3, 5))
  if (nowMin < startMin) {
    return {
      open: false,
      reason: `오늘 ${settings.start_time}에 시작합니다`,
    }
  }

  if (settings.end_time) {
    const endMin =
      Number(settings.end_time.slice(0, 2)) * 60 +
      Number(settings.end_time.slice(3, 5))
    if (nowMin >= endMin) {
      return { open: false, reason: "대회가 종료되었어요" }
    }
  }

  return { open: true, reason: null }
}
