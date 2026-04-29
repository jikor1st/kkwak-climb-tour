"use client"

import { useEffect, useState } from "react"
import type { Timeline, TimelineStop } from "@/lib/contest/schedule"
import {
  computeCurrentStatus,
  nowMinutesKST,
  todayDateStringKST,
} from "@/lib/contest/timeline-now"

type Props = {
  timeline: Timeline
  contestDate: string | null
  showCurrentMarker?: boolean
}

export function TimelineList({
  timeline,
  contestDate,
  showCurrentMarker = true,
}: Props) {
  const [now, setNow] = useState<{ min: number; date: string }>(() => ({
    min: nowMinutesKST(),
    date: todayDateStringKST(),
  }))

  useEffect(() => {
    if (!showCurrentMarker) return

    let id: ReturnType<typeof setInterval> | null = null
    const sync = () => {
      setNow({ min: nowMinutesKST(), date: todayDateStringKST() })
    }
    const start = () => {
      sync()
      if (id != null) clearInterval(id)
      id = setInterval(sync, 30_000)
    }
    const stop = () => {
      if (id != null) {
        clearInterval(id)
        id = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      stop()
    }
  }, [showCurrentMarker])

  if (!timeline.hasStartTime) {
    return (
      <div className="bg-mute rounded-xl p-4 text-sm text-ink-700 text-center">
        일정이 아직 확정되지 않았어요.
      </div>
    )
  }

  const isContestDay =
    showCurrentMarker && (!contestDate || contestDate === now.date)
  const status = isContestDay
    ? computeCurrentStatus(timeline, now.min)
    : { kind: "no-schedule" as const }
  const activeIndex = status.kind === "active" ? status.stopIndex : -1

  return (
    <ol className="space-y-1.5">
      {timeline.stops.map((stop, idx) => {
        const isActive = idx === activeIndex
        const isPast = activeIndex !== -1 && idx < activeIndex
        const isBreak = stop.type === "break"

        const baseCls = "flex items-center gap-3 p-3 rounded-xl border transition"
        let cls: string
        if (isActive) {
          cls = `${baseCls} bg-accent border-accent text-white shadow-pop`
        } else if (isBreak) {
          cls = `${baseCls} bg-accent-soft border-accent/20 ${isPast ? "opacity-50" : ""}`
        } else {
          cls = `${baseCls} bg-surface border-line ${isPast ? "opacity-50" : ""}`
        }

        const timeColor = isActive
          ? "text-white opacity-90"
          : isBreak
            ? "text-accent"
            : "text-ink-500"
        const labelColor = isActive ? "text-white" : "text-ink-900"
        const durColor = isActive
          ? "text-white opacity-80"
          : isBreak
            ? "text-ink-700"
            : "text-ink-500"

        const iconBadgeCls = isActive
          ? "bg-white/20 text-white"
          : isBreak
            ? "bg-accent/15 text-accent"
            : "bg-ink-900 text-white"

        const key = stop.type === "gym" ? stop.gymId : stop.breakId
        return (
          <li key={key} className={cls}>
            <div
              className={`w-14 shrink-0 flex flex-col leading-tight ${timeColor}`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider num">
                {stop.start}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider num opacity-60">
                ~{stop.end}
              </span>
            </div>
            <div
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${iconBadgeCls}`}
              aria-hidden="true"
            >
              <StopIcon stop={stop} className="w-4 h-4" />
            </div>
            <div className={`flex-1 font-black text-sm min-w-0 ${labelColor}`}>
              <span className="truncate">{stop.name}</span>
              {isActive && (
                <span className="ml-1.5 text-[10px] font-black uppercase opacity-90">
                  · 진행 중
                </span>
              )}
            </div>
            <div className={`text-xs num font-bold ${durColor}`}>
              {stop.durationMinutes}분
            </div>
          </li>
        )
      })}
      {(timeline.endLabel ?? timeline.computedEndLabel) && (
        <li className="flex items-center gap-3 p-3 rounded-xl bg-ink-900 text-white">
          <span className="text-[10px] font-black uppercase tracking-wider w-14 shrink-0 num">
            {timeline.endLabel ?? timeline.computedEndLabel}
          </span>
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-white/15" aria-hidden="true">
            <FlagIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 font-black text-sm">종료</div>
        </li>
      )}
    </ol>
  )
}

function StopIcon({
  stop,
  className,
}: {
  stop: TimelineStop
  className?: string
}) {
  if (stop.type === "gym") return <MountainIcon className={className} />
  const name = stop.name
  if (/이동/.test(name)) return <ArrowRightIcon className={className} />
  if (/(식사|점심|저녁|아침|밥)/.test(name)) return <UtensilsIcon className={className} />
  if (/(몸풀기|준비|스트레칭)/.test(name)) return <ActivityIcon className={className} />
  return <PauseIcon className={className} />
}

function MountainIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
    >
      <path d="M14 4.5 21.5 19H6.5l4-7.2L14 4.5Z" />
      <path d="m8.7 11 3.6 8H2L8.7 11Z" opacity="0.85" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function UtensilsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v6a3 3 0 0 0 3 3v9" />
      <path d="M9 3v6a3 3 0 0 1-3 3" />
      <path d="M15 21V14c0-3 2-5 4-5h1V3" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6" />
      <path d="M14 9v6" />
    </svg>
  )
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  )
}
