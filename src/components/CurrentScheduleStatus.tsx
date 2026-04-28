"use client"

import { useEffect, useState } from "react"
import type { Timeline } from "@/lib/contest/schedule"
import {
  computeCurrentStatus,
  formatDurationShort,
  nowMinutesKST,
  todayDateStringKST,
} from "@/lib/contest/timeline-now"

type Props = {
  timeline: Timeline
  contestDate: string | null
}

export function CurrentScheduleStatus({ timeline, contestDate }: Props) {
  const [now, setNow] = useState<{ min: number; date: string }>(() => ({
    min: nowMinutesKST(),
    date: todayDateStringKST(),
  }))

  useEffect(() => {
    const id = setInterval(() => {
      setNow({ min: nowMinutesKST(), date: todayDateStringKST() })
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!timeline.hasStartTime) return null

  const status = computeCurrentStatus(timeline, now.min)

  if (contestDate && contestDate !== now.date) {
    const isFuture = contestDate > now.date
    return (
      <Wrap kind="muted">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1">
              {isFuture ? "대회 예정" : "지난 대회"}
            </div>
            <div className="text-base font-black">
              {formatDateShort(contestDate)}
            </div>
          </div>
          <div className="text-xs text-ink-500 num">
            {timeline.startLabel}~
            {timeline.endLabel ?? timeline.computedEndLabel}
          </div>
        </div>
      </Wrap>
    )
  }

  if (status.kind === "no-schedule") return null

  if (status.kind === "before") {
    return (
      <Wrap kind="info">
        <div className="text-[10px] font-black text-accent uppercase tracking-wider mb-1.5">
          시작까지
        </div>
        <div className="flex items-end gap-2 mb-1">
          <div className="text-3xl font-black num">
            {formatDurationShort(status.minutesUntilStart)}
          </div>
          <div className="text-sm text-ink-500 mb-1.5 font-bold">남았어요</div>
        </div>
        <div className="text-xs text-ink-700">
          첫 일정 ·{" "}
          <strong className="text-ink-900">{status.firstStop.name}</strong>{" "}
          <span className="num">{status.firstStop.start}</span>
        </div>
      </Wrap>
    )
  }

  if (status.kind === "after") {
    return (
      <Wrap kind="muted">
        <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1.5">
          대회 종료
        </div>
        <div className="text-base font-black">수고하셨어요!</div>
        {status.endLabel && (
          <div className="text-xs text-ink-500 mt-1 num">
            {status.endLabel} 종료
          </div>
        )}
      </Wrap>
    )
  }

  // active
  const isBreak = status.stop.type === "break"
  const totalMin = status.elapsedMin + status.remainingMin
  const progress = totalMin > 0 ? Math.round((status.elapsedMin / totalMin) * 100) : 0
  const next = status.next

  return (
    <Wrap kind={isBreak ? "break" : "active"}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-wider opacity-90">
          {isBreak ? "쉬는 시간" : "지금 있어야 할 곳"}
        </div>
        <div className="text-[10px] font-black opacity-80 num">
          {status.stop.start} – {status.stop.end}
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="text-3xl sm:text-4xl font-black leading-none">
          {status.stop.name}
        </div>
        <div className="text-right">
          <div className="text-[11px] opacity-80 font-bold">남은 시간</div>
          <div className="text-xl font-black num">
            {formatDurationShort(status.remainingMin)}
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-white rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {next && (
        <div className="text-[11px] opacity-90 flex items-center gap-1.5">
          <span>다음:</span>
          <strong className="font-black">{next.name}</strong>
          <span className="num">{next.start}</span>
        </div>
      )}
    </Wrap>
  )
}

function Wrap({
  kind,
  children,
}: {
  kind: "active" | "break" | "info" | "muted"
  children: React.ReactNode
}) {
  const cls =
    kind === "active"
      ? "bg-accent text-white shadow-pop border-transparent"
      : kind === "break"
        ? "bg-ink-900 text-white shadow-pop border-transparent"
        : kind === "info"
          ? "bg-surface border-line"
          : "bg-mute border-line"
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${cls} mb-4`}>
      {children}
    </div>
  )
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

function formatDateShort(value: string): string {
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`
}
