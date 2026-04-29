"use client"

import { useEffect, useState } from "react"
import type { Timeline } from "@/lib/contest/schedule"
import {
  computeCurrentStatus,
  nowMinutesKST,
  todayDateStringKST,
} from "@/lib/contest/timeline-now"
import { GymIcon } from "@/components/icons/GymIcon"

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

        const isGym = stop.type === "gym"
        const iconBadgeCls = isActive
          ? "bg-white/20 text-white"
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
            {isGym ? (
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${iconBadgeCls}`}
                aria-hidden="true"
              >
                <GymIcon className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 shrink-0" aria-hidden="true" />
            )}
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
          <div className="w-7 shrink-0" aria-hidden="true" />
          <div className="flex-1 font-black text-sm">종료</div>
        </li>
      )}
    </ol>
  )
}

