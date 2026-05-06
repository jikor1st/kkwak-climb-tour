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
  const endLabel = timeline.endLabel

  return (
    <ol className="space-y-1">
      {timeline.stops.map((stop, idx) => {
        const isActive = idx === activeIndex
        const isPast = activeIndex !== -1 && idx < activeIndex
        const isGym = stop.type === "gym"
        const key = stop.type === "gym" ? stop.gymId : stop.breakId
        const fade = isPast && !isActive ? "opacity-40" : ""

        // 비활성 break — 카드 대신 인라인 연결 텍스트 (시작~끝 시간 유지)
        if (!isGym && !isActive) {
          return (
            <li
              key={key}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-1.5 ${fade}`}
            >
              <div className="w-12 sm:w-14 shrink-0 flex flex-col leading-tight text-ink-500">
                <span className="text-[10px] font-black uppercase tracking-wider num">
                  {stop.start}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider num opacity-60">
                  ~{stop.end}
                </span>
              </div>
              <span
                className="w-5 sm:w-7 shrink-0 text-center text-ink-300 text-xs"
                aria-hidden
              >
                ↓
              </span>
              <span className="flex-1 min-w-0 wrap-break-word text-[11px] sm:text-xs font-bold text-ink-700 leading-snug">
                {stop.name}
              </span>
              <span className="text-[11px] sm:text-xs num font-bold shrink-0 text-ink-500">
                {stop.durationMinutes}분
              </span>
            </li>
          )
        }

        // gym 또는 활성 break — 카드
        const cardCls = isActive
          ? "bg-accent border-accent text-white shadow-pop"
          : `bg-surface border-line ${fade}`
        const timeColor = isActive ? "text-white opacity-90" : "text-ink-500"
        const labelColor = isActive ? "text-white" : "text-ink-900"
        const durColor = isActive ? "text-white opacity-80" : "text-ink-500"
        const iconBadgeCls = isActive
          ? "bg-white/20 text-white"
          : "bg-ink-900 text-white"

        return (
          <li
            key={key}
            className={`flex items-center gap-2 sm:gap-3 p-3 rounded-xl border transition ${cardCls}`}
          >
            <div
              className={`w-12 sm:w-14 shrink-0 flex flex-col leading-tight ${timeColor}`}
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
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0 flex items-center justify-center ${iconBadgeCls}`}
                aria-hidden="true"
              >
                <GymIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            ) : (
              <div className="w-6 sm:w-7 shrink-0" aria-hidden="true" />
            )}
            <div className={`flex-1 font-black text-[13px] sm:text-sm min-w-0 leading-snug ${labelColor}`}>
              <span className="wrap-break-word">{stop.name}</span>
              {isActive && (
                <span className="ml-1.5 text-[10px] font-black uppercase opacity-90 whitespace-nowrap">
                  · 진행 중
                </span>
              )}
            </div>
            <div className={`text-[11px] sm:text-xs num font-bold shrink-0 ${durColor}`}>
              {stop.durationMinutes}분
            </div>
          </li>
        )
      })}
      {endLabel && (
        <li className="flex items-center gap-3 p-3 rounded-xl bg-ink-900 text-white mt-2">
          <span className="text-[10px] font-black uppercase tracking-wider w-14 shrink-0 num">
            {endLabel}
          </span>
          <div className="w-7 shrink-0" aria-hidden="true" />
          <div className="flex-1 font-black text-sm">종료</div>
        </li>
      )}
      <li className="mt-3 px-3 py-2.5 bg-mute/60 rounded-lg text-[11px] text-ink-700 leading-relaxed">
        <strong className="text-ink-900">이동 방식(지하철 노선·도보 등)은 참고용</strong>이에요.
        편한 경로로 시간만 맞춰 이동해주세요.
      </li>
    </ol>
  )
}

