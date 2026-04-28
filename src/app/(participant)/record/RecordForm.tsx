"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { GymData } from "@/lib/contest/load"
import type { Category, SolveGrade } from "@/lib/contest/grades"

type SaveState = "idle" | "saving" | "saved" | "error"

type Props = {
  participant: { id: string; display_name: string; category: Category }
  meta: { label: string; solveLabel: string; color: string; bg: string }
  grade: SolveGrade
  gyms: GymData[]
  initialGymId: string | null
  initialTotals: { solved: number; total: number; rate: number }
  emptyState: React.ReactNode
}

export function RecordForm({
  participant,
  meta,
  grade,
  gyms,
  initialGymId,
  initialTotals,
  emptyState,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const g of gyms) for (const w of g.walls) init[w.id] = w.solved_count
    return init
  })
  const [activeGymId, setActiveGymId] = useState<string | null>(initialGymId)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const wallTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of gyms) for (const w of g.walls) map.set(w.id, w.total_count)
    return map
  }, [gyms])

  const totals = useMemo(() => {
    let solved = 0
    let total = 0
    for (const g of gyms) {
      for (const w of g.walls) {
        solved += counts[w.id] ?? 0
        total += w.total_count
      }
    }
    const rate = total > 0 ? Math.round((solved / total) * 100) : 0
    return { solved, total, rate }
  }, [counts, gyms])

  const gymProgress = useMemo(() => {
    return gyms.map((g) => {
      const solved = g.walls.reduce((s, w) => s + (counts[w.id] ?? 0), 0)
      const ratio =
        g.total_count > 0 ? Math.round((solved / g.total_count) * 100) : 0
      return { id: g.id, solved, ratio }
    })
  }, [counts, gyms])

  useEffect(() => {
    return () => {
      debounceRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  function persist(wallId: string, value: number) {
    const existing = debounceRef.current.get(wallId)
    if (existing) clearTimeout(existing)
    const handle = setTimeout(async () => {
      setSaveState("saving")
      try {
        const res = await fetch("/api/participant/solves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wall_id: wallId, grade, solved_count: value }),
        })
        if (!res.ok) throw new Error("save failed")
        const data = await res.json()
        if (typeof data.solved_count === "number") {
          setCounts((c) => ({ ...c, [wallId]: data.solved_count }))
        }
        setSaveState("saved")
        setSavedAt(new Date())
      } catch (err) {
        console.error(err)
        setSaveState("error")
      } finally {
        debounceRef.current.delete(wallId)
      }
    }, 400)
    debounceRef.current.set(wallId, handle)
  }

  function adjust(wallId: string, delta: number) {
    setCounts((c) => {
      const total = wallTotals.get(wallId) ?? 0
      const next = Math.max(0, Math.min((c[wallId] ?? 0) + delta, total))
      if (next === c[wallId]) return c
      persist(wallId, next)
      return { ...c, [wallId]: next }
    })
  }

  function setExact(wallId: string, raw: string) {
    const total = wallTotals.get(wallId) ?? 0
    const parsed = parseInt(raw, 10)
    const next = isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, total))
    setCounts((c) => ({ ...c, [wallId]: next }))
    persist(wallId, next)
  }

  if (emptyState) {
    return <>{emptyState}</>
  }

  const activeGym = gyms.find((g) => g.id === activeGymId) ?? gyms[0]

  return (
    <div className="pb-32">
      {/* Sticky header */}
      <div className="sticky top-12 z-30 bg-paper/95 backdrop-blur-md border-b border-line">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-accent uppercase tracking-[0.2em] font-black">
              RECORD · 풀이 기록
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-black text-ink-700 hover:text-accent transition"
            >
              순위/요약 →
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="font-black text-base">
              {participant.display_name}
            </span>
            <span
              className="grade-pill"
              style={{
                color: meta.color,
                borderColor: meta.color,
                background: meta.bg,
              }}
            >
              <span
                className="grade-dot"
                style={{ background: meta.color }}
              />
              {meta.label}조 · {meta.solveLabel}
            </span>
          </div>
          <div className="flex items-end justify-between mb-2">
            <div className="num">
              <span className="text-2xl font-black">{totals.solved}</span>
              <span className="text-ink-500 text-base">
                {" "}
                / {totals.total} 완등
              </span>
            </div>
            <div className="text-2xl font-black text-accent num">
              {totals.rate}%
            </div>
          </div>
          <div className="h-2 bg-mute rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${totals.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gym tabs */}
      <div className="max-w-3xl mx-auto px-5 pt-5">
        <div className="text-xs text-ink-500 uppercase tracking-wider mb-2 font-bold">
          지점 선택
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
          {gyms.map((g) => {
            const prog = gymProgress.find((p) => p.id === g.id)!
            const selected = g.id === activeGymId
            const empty = g.total_count === 0
            const completed = prog.ratio === 100 && !empty
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGymId(g.id)}
                className={`shrink-0 px-4 py-3 rounded-xl text-sm font-black transition flex items-center gap-2 border ${
                  selected
                    ? "bg-accent text-white border-accent shadow-pop"
                    : "bg-surface text-ink-900 border-line hover:border-line-strong shadow-soft"
                }`}
              >
                <span>{g.name}</span>
                {empty ? (
                  <span
                    className={`text-[10px] font-bold ${
                      selected ? "opacity-80" : "text-ink-300"
                    }`}
                  >
                    미등록
                  </span>
                ) : (
                  <span
                    className={`text-xs num font-bold ${
                      selected
                        ? "opacity-90"
                        : completed
                        ? "text-grade-green"
                        : "text-ink-500"
                    }`}
                  >
                    {prog.solved}/{g.total_count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="max-w-3xl mx-auto px-5 pt-3">
        <div className="bg-mute rounded-xl px-4 py-3 text-xs text-ink-700 leading-relaxed">
          벽마다 본인이 완등한{" "}
          <strong className="text-ink-900">{meta.solveLabel}</strong> 갯수를{" "}
          <strong className="text-ink-900">+ / −</strong> 또는 숫자 탭으로
          기록해주세요. 자동 저장됩니다.
        </div>
      </div>

      {/* Walls */}
      <div className="max-w-3xl mx-auto px-5 pt-3 space-y-3">
        <div className="text-xs text-ink-500 font-bold tracking-wider px-1 mt-2">
          {activeGym?.name}점 · {meta.solveLabel}
        </div>

        {!activeGym || activeGym.walls.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-6 text-center text-sm text-ink-500">
            이 지점은 아직 벽이 등록되지 않았어요.
          </div>
        ) : (
          activeGym.walls.map((w) => (
            <WallCard
              key={w.id}
              wallId={w.id}
              name={w.name}
              total={w.total_count}
              count={counts[w.id] ?? 0}
              accent={meta.color}
              onAdjust={adjust}
              onExact={setExact}
            />
          ))
        )}

        <SaveStatus state={saveState} savedAt={savedAt} />
      </div>
    </div>
  )
}

function WallCard({
  wallId,
  name,
  total,
  count,
  accent,
  onAdjust,
  onExact,
}: {
  wallId: string
  name: string
  total: number
  count: number
  accent: string
  onAdjust: (id: string, delta: number) => void
  onExact: (id: string, raw: string) => void
}) {
  const ratio = total > 0 ? Math.round((count / total) * 100) : 0
  const minusDisabled = count <= 0 || total === 0
  const plusDisabled = count >= total || total === 0

  function handleEdit() {
    if (total === 0) return
    const v = window.prompt(`${name} - 직접 입력 (0~${total})`, String(count))
    if (v !== null) onExact(wallId, v)
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-black text-lg">{name}</div>
          <div className="text-xs text-ink-500 mt-0.5">
            {total === 0 ? "문제 수 미등록" : `전체 ${total}개`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500 font-bold">완등률</div>
          <div
            className={`text-sm font-black num ${
              count === 0 ? "text-ink-300" : ""
            }`}
          >
            {ratio}%
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-mute rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${ratio}%`, background: accent }}
        />
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onAdjust(wallId, -1)}
          disabled={minusDisabled}
          className="w-14 h-14 rounded-2xl bg-mute hover:bg-line disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center text-2xl font-black active:scale-95"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleEdit}
          disabled={total === 0}
          className="flex-1 text-center py-2 rounded-xl hover:bg-mute disabled:hover:bg-transparent transition disabled:cursor-not-allowed"
        >
          <div
            className={`text-4xl font-black num leading-none ${
              count === 0 ? "text-ink-300" : ""
            }`}
          >
            {count}
          </div>
          <div className="text-xs text-ink-500 num mt-1">/ {total}</div>
        </button>
        <button
          type="button"
          onClick={() => onAdjust(wallId, 1)}
          disabled={plusDisabled}
          className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center text-2xl font-black text-white shadow-pop active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  )
}

function SaveStatus({
  state,
  savedAt,
}: {
  state: SaveState
  savedAt: Date | null
}) {
  if (state === "idle" && !savedAt) return null

  let dot = "bg-ink-300"
  let text: string = "기록을 입력해주세요"
  if (state === "saving") {
    dot = "bg-accent animate-pulse"
    text = "저장 중..."
  } else if (state === "saved") {
    dot = "bg-grade-green"
    text = `자동 저장됨${formatTime(savedAt)}`
  } else if (state === "error") {
    dot = "bg-accent"
    text = "저장 실패 — 잠시 후 다시 시도됩니다"
  }

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-ink-500 pt-2">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </div>
  )
}

function formatTime(d: Date | null) {
  if (!d) return ""
  const diff = Math.round((Date.now() - d.getTime()) / 1000)
  if (diff < 5) return " · 방금 전"
  if (diff < 60) return ` · ${diff}초 전`
  const min = Math.floor(diff / 60)
  if (min < 60) return ` · ${min}분 전`
  return ""
}
