"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Timeline } from "@/lib/contest/schedule"
import {
  computeCurrentStatusSec,
  type CurrentStatusSec,
  nowSecondsKST,
  todayDateStringKST,
} from "@/lib/contest/timeline-now"

type GymRow = {
  id: string
  name: string
  total_count: number
  solved_count: number
}

type Props = {
  gyms: GymRow[]
  timeline: Timeline
  contestDate: string | null
  accentColor: string
}

type Target = { gymId: string; label: string } | null

function determineTarget(
  status: CurrentStatusSec,
  gyms: GymRow[],
): Target {
  if (status.kind === "active") {
    if (status.stop.type === "gym") {
      return { gymId: status.stop.gymId, label: "지금 여기" }
    }
    // break
    const prevGymId = status.prevGym?.gymId
    const nextGymId = status.nextGym?.gymId
    if (prevGymId) {
      const prevGym = gyms.find((g) => g.id === prevGymId)
      const incomplete =
        prevGym && (prevGym.total_count === 0 || prevGym.solved_count < prevGym.total_count)
      if (incomplete && prevGym && prevGym.total_count > 0) {
        return { gymId: prevGymId, label: "기록 마무리" }
      }
    }
    if (nextGymId) {
      return { gymId: nextGymId, label: "곧 도착" }
    }
    if (prevGymId) {
      return { gymId: prevGymId, label: "방금 마무리" }
    }
    return null
  }
  if (status.kind === "before") {
    if (gyms.length > 0) {
      return { gymId: gyms[0].id, label: "곧 시작" }
    }
  }
  return null
}

export function GymProgressList({
  gyms,
  timeline,
  contestDate,
  accentColor,
}: Props) {
  const [now, setNow] = useState<{ sec: number; date: string }>(() => ({
    sec: nowSecondsKST(),
    date: todayDateStringKST(),
  }))

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null
    const sync = () => setNow({ sec: nowSecondsKST(), date: todayDateStringKST() })
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
  }, [])

  const isContestDay = !contestDate || contestDate === now.date
  const status: CurrentStatusSec =
    isContestDay && timeline.hasStartTime
      ? computeCurrentStatusSec(timeline, now.sec)
      : { kind: "no-schedule" }
  const target = determineTarget(status, gyms)

  return (
    <div className="space-y-2">
      {gyms.map((gym, i) => {
        const ratio =
          gym.total_count > 0
            ? Math.round((gym.solved_count / gym.total_count) * 100)
            : 0
        const empty = gym.total_count === 0
        const isTarget = target?.gymId === gym.id

        const cardCls = isTarget
          ? "flex items-center gap-3 p-3.5 rounded-xl border-2 border-accent bg-accent-soft transition group shadow-sm"
          : "flex items-center gap-3 p-3.5 rounded-xl border border-line hover:border-line-strong transition group"

        const indexCls = isTarget
          ? "w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-xs font-black text-white shrink-0"
          : "w-9 h-9 rounded-lg bg-mute flex items-center justify-center text-xs font-black text-ink-700 shrink-0"

        return (
          <Link
            key={gym.id}
            href={`/record?gym=${gym.id}`}
            className={cardCls}
            aria-current={isTarget ? "true" : undefined}
          >
            <div className={indexCls}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black">{gym.name}</span>
                {isTarget && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-accent px-1.5 py-0.5 rounded-full tracking-wider">
                    <span className="relative inline-flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-white live-dot-ring" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white live-dot" />
                    </span>
                    {target!.label}
                  </span>
                )}
                {ratio === 100 && gym.total_count > 0 && !isTarget && (
                  <span className="text-[10px] font-black text-grade-green tracking-wider">
                    ✓ 완료
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1 bg-mute rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${ratio}%`,
                    background: empty ? "transparent" : accentColor,
                  }}
                />
              </div>
            </div>
            <div className="text-right shrink-0 num">
              {empty ? (
                <span className="text-xs text-ink-300 font-bold">벽 미등록</span>
              ) : (
                <>
                  <div className="text-sm font-black">
                    {gym.solved_count}
                    <span className="text-ink-500">/{gym.total_count}</span>
                  </div>
                  <div className="text-[10px] text-ink-500 font-bold">{ratio}%</div>
                </>
              )}
            </div>
            <span
              className={`text-sm transition ${
                isTarget
                  ? "text-accent group-hover:opacity-80"
                  : "text-ink-300 group-hover:text-ink-700"
              }`}
            >
              →
            </span>
          </Link>
        )
      })}
    </div>
  )
}
