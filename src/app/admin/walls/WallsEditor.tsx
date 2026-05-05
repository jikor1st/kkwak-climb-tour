"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { TextInputDialog } from "@/components/TextInputDialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"

type Gym = {
  id: string
  name: string
  display_order: number
  active: boolean
  pending?: boolean
}
type Wall = {
  id: string
  gym_id: string
  name: string
  display_order: number
  active: boolean
  pending?: boolean
}
type GradeCount = { wall_id: string; grade: string; total_count: number }
type GradeMeta = {
  key: string
  label: string
  color: string
  divisionLabel: string
}

function softBg(hex: string): string {
  const h = hex.replace("#", "")
  if (h.length !== 6) return "#F4F4F4"
  return `#${h}1A`
}

type SaveState = "idle" | "saving" | "saved" | "error"

export function WallsEditor({
  gyms: initialGyms,
  walls: initialWalls,
  gradeCounts: initialCounts,
  grades,
}: {
  gyms: Gym[]
  walls: Wall[]
  gradeCounts: GradeCount[]
  grades: GradeMeta[]
}) {
  const GRADES = grades
  const [gyms, setGyms] = useState<Gym[]>(initialGyms)
  const [walls, setWalls] = useState<Wall[]>(initialWalls)
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const g of initialCounts) init[`${g.wall_id}:${g.grade}`] = g.total_count
    return init
  })
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveError, setSaveError] = useState<string>("")
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [addingForGymId, setAddingForGymId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Wall | null>(null)
  const [addingGym, setAddingGym] = useState(false)
  const [deleteGymTarget, setDeleteGymTarget] = useState<Gym | null>(null)
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const inflightRef = useRef(0)

  const wallsByGym = useMemo(() => {
    const map = new Map<string, Wall[]>()
    for (const g of gyms) map.set(g.id, [])
    for (const w of walls) {
      if (!map.has(w.gym_id)) map.set(w.gym_id, [])
      map.get(w.gym_id)!.push(w)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.display_order - b.display_order)
    }
    return map
  }, [gyms, walls])

  const stats = useMemo(() => {
    let total = 0
    let wallCount = 0
    for (const w of walls) {
      if (w.pending) continue
      wallCount++
      for (const g of GRADES) total += counts[`${w.id}:${g.key}`] ?? 0
    }
    return { total, wallCount }
  }, [walls, counts])

  function flagSaving() {
    inflightRef.current++
    setSaveState("saving")
  }
  function flagDone(ok: boolean, message?: string) {
    inflightRef.current = Math.max(0, inflightRef.current - 1)
    if (inflightRef.current > 0) return
    if (ok) {
      setSaveState("saved")
      setSaveError("")
      setSavedAt(new Date())
    } else {
      setSaveState("error")
      setSaveError(message || "저장 실패")
    }
  }

  useEffect(() => {
    return () => debounceRef.current.forEach((t) => clearTimeout(t))
  }, [])

  async function addWallWithName(gymId: string, name: string) {
    flagSaving()
    try {
      const res = await fetch("/api/admin/walls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gym_id: gymId, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "생성 실패")
      setWalls((ws) => [...ws, data.wall])
      flagDone(true)
    } catch (err) {
      flagDone(false, err instanceof Error ? err.message : "생성 실패")
    }
  }

  function persistRename(wallId: string, name: string) {
    const key = `name:${wallId}`
    const existing = debounceRef.current.get(key)
    if (existing) clearTimeout(existing)
    const t = setTimeout(async () => {
      flagSaving()
      try {
        const res = await fetch(`/api/admin/walls/${wallId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "수정 실패")
        flagDone(true)
      } catch (err) {
        flagDone(false, err instanceof Error ? err.message : "수정 실패")
      }
    }, 500)
    debounceRef.current.set(key, t)
  }

  function persistCount(wallId: string, grade: string, value: number) {
    const key = `count:${wallId}:${grade}`
    const existing = debounceRef.current.get(key)
    if (existing) clearTimeout(existing)
    const t = setTimeout(async () => {
      flagSaving()
      try {
        const res = await fetch("/api/admin/grade-counts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wall_id: wallId, grade, total_count: value }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "저장 실패")
        flagDone(true)
      } catch (err) {
        flagDone(false, err instanceof Error ? err.message : "저장 실패")
      }
    }, 400)
    debounceRef.current.set(key, t)
  }

  function renameWall(wallId: string, name: string) {
    setWalls((ws) => ws.map((w) => (w.id === wallId ? { ...w, name } : w)))
    if (name.trim()) persistRename(wallId, name.trim())
  }

  function setCount(wallId: string, grade: string, raw: string | number) {
    const parsed = typeof raw === "number" ? raw : parseInt(raw, 10)
    const v = isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, 99))
    setCounts((c) => ({ ...c, [`${wallId}:${grade}`]: v }))
    persistCount(wallId, grade, v)
  }

  async function addGymWithName(name: string) {
    flagSaving()
    try {
      const res = await fetch("/api/admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "생성 실패")
      setGyms((gs) => [...gs, data.gym])
      flagDone(true)
    } catch (err) {
      flagDone(false, err instanceof Error ? err.message : "생성 실패")
    }
  }

  function persistGymRename(gymId: string, name: string) {
    const key = `gym-name:${gymId}`
    const existing = debounceRef.current.get(key)
    if (existing) clearTimeout(existing)
    const t = setTimeout(async () => {
      flagSaving()
      try {
        const res = await fetch(`/api/admin/gyms/${gymId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "수정 실패")
        flagDone(true)
      } catch (err) {
        flagDone(false, err instanceof Error ? err.message : "수정 실패")
      }
    }, 500)
    debounceRef.current.set(key, t)
  }

  function renameGym(gymId: string, name: string) {
    setGyms((gs) => gs.map((g) => (g.id === gymId ? { ...g, name } : g)))
    if (name.trim()) persistGymRename(gymId, name.trim())
  }

  async function toggleGymActive(gym: Gym) {
    const next = !gym.active
    setGyms((gs) => gs.map((g) => (g.id === gym.id ? { ...g, active: next } : g)))
    flagSaving()
    try {
      const res = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "수정 실패")
      flagDone(true)
    } catch (err) {
      setGyms((gs) =>
        gs.map((g) => (g.id === gym.id ? { ...g, active: !next } : g)),
      )
      flagDone(false, err instanceof Error ? err.message : "수정 실패")
    }
  }

  async function deleteGymConfirmed(gym: Gym) {
    flagSaving()
    try {
      const res = await fetch(`/api/admin/gyms/${gym.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "삭제 실패")
      setGyms((gs) => gs.filter((g) => g.id !== gym.id))
      flagDone(true)
    } catch (err) {
      flagDone(false, err instanceof Error ? err.message : "삭제 실패")
    }
  }

  async function deleteWallConfirmed(wall: Wall) {
    flagSaving()
    try {
      const res = await fetch(`/api/admin/walls/${wall.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "삭제 실패")
      setWalls((ws) => ws.filter((w) => w.id !== wall.id))
      setCounts((c) => {
        const next = { ...c }
        for (const g of GRADES) delete next[`${wall.id}:${g.key}`]
        return next
      })
      flagDone(true)
    } catch (err) {
      flagDone(false, err instanceof Error ? err.message : "삭제 실패")
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 pb-32">
      {/* Page header */}
      <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
        <div>
          <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
            STEP 1
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            벽 · 문제 수 등록
          </h1>
          <p className="text-sm text-ink-700 mt-1.5">
            지점마다 벽을 추가하고, 각 벽의{" "}
            <span className="text-accent font-black">
              {GRADES.map((g) => g.label).join("·")}
            </span>{" "}
            문제 수를 입력해주세요.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Stat label="등록된 벽" value={stats.wallCount} />
          <Stat label="총 문제" value={stats.total} />
        </div>
      </div>

      {/* Save status */}
      <div className="mb-5">
        <SaveBar state={saveState} savedAt={savedAt} error={saveError} />
      </div>

      {/* Gym sections */}
      <div className="space-y-4">
        {gyms.map((gym, idx) => {
          const list = wallsByGym.get(gym.id) ?? []
          const gymTotal = list.reduce((s, w) => {
            return s + GRADES.reduce((ss, g) => ss + (counts[`${w.id}:${g.key}`] ?? 0), 0)
          }, 0)
          return (
            <section
              key={gym.id}
              className={`bg-surface border rounded-3xl shadow-soft overflow-hidden ${
                gym.active ? "border-line" : "border-line-strong opacity-60"
              }`}
            >
              <header className="flex items-center gap-3 px-5 py-4 border-b border-line bg-mute/40 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-ink-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-35">
                  <input
                    type="text"
                    value={gym.name}
                    onChange={(e) => renameGym(gym.id, e.target.value)}
                    placeholder="지점명"
                    className="w-full max-w-45 px-2.5 py-1.5 bg-transparent focus:bg-surface border border-transparent focus:border-ink-900 rounded-lg outline-none text-base font-black transition"
                  />
                  <div className="text-[11px] text-ink-500 font-bold mt-0.5 ml-2.5">
                    {list.length}벽 · 총 {gymTotal}개
                    {!gym.active && (
                      <span className="ml-2 text-accent">· 비활성</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleGymActive(gym)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition ${
                      gym.active
                        ? "bg-mute text-ink-700 hover:bg-line"
                        : "bg-grade-green/10 text-grade-green hover:bg-grade-green/20"
                    }`}
                  >
                    {gym.active ? "비활성" : "활성"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteGymTarget(gym)}
                    className="w-8 h-8 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition"
                    aria-label="지점 삭제"
                    title="지점 삭제 (벽이 0개일 때만)"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingForGymId(gym.id)}
                    className="px-3 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-black shadow-pop transition active:scale-95"
                  >
                    + 벽 추가
                  </button>
                </div>
              </header>

              {list.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-ink-500">
                  아직 등록된 벽이 없어요.{" "}
                  <button
                    type="button"
                    onClick={() => setAddingForGymId(gym.id)}
                    className="text-accent font-black hover:underline"
                  >
                    + 첫 벽 추가하기
                  </button>
                </div>
              ) : (
                <>
                  {/* Header row (desktop) */}
                  <div
                    className="hidden sm:grid gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider font-black text-ink-500 border-b border-line"
                    style={{
                      gridTemplateColumns: `minmax(0,1fr) repeat(${GRADES.length}, 8.5rem) 2.5rem`,
                    }}
                  >
                    <div>벽 이름</div>
                    {GRADES.map((g) => (
                      <div key={g.key} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: g.color }}
                        />
                        {g.label}
                        {g.divisionLabel ? ` (${g.divisionLabel})` : ""}
                      </div>
                    ))}
                    <div />
                  </div>
                  <ul className="divide-y divide-line">
                    {list.map((wall) => (
                      <WallRow
                        key={wall.id}
                        wall={wall}
                        counts={counts}
                        grades={GRADES}
                        onRename={(name) => renameWall(wall.id, name)}
                        onCountChange={(grade, raw) =>
                          setCount(wall.id, grade, raw)
                        }
                        onDelete={() => setDeleteTarget(wall)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </section>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setAddingGym(true)}
        className="mt-4 w-full py-4 rounded-2xl bg-surface border-2 border-dashed border-line hover:border-accent hover:bg-accent-soft text-sm font-black text-ink-700 hover:text-accent transition"
      >
        + 지점 추가
      </button>

      <p className="mt-6 text-xs text-ink-500 text-center">
        모든 변경사항은 자동 저장됩니다. 입력 후 다른 곳을 클릭하거나 잠시
        기다리면 저장돼요.
      </p>

      <TextInputDialog
        open={addingGym}
        title="새 지점 추가"
        subtitle="신사·논현 같은 지점 이름을 입력하세요"
        placeholder="예: 잠실"
        confirmLabel="추가"
        onConfirm={(name) => {
          setAddingGym(false)
          addGymWithName(name)
        }}
        onCancel={() => setAddingGym(false)}
      />

      <ConfirmDialog
        open={deleteGymTarget !== null}
        title="지점을 완전 삭제할까요?"
        variant="danger"
        confirmLabel="완전 삭제"
        message={
          deleteGymTarget ? (
            <>
              <strong className="text-ink-900">{deleteGymTarget.name}</strong>{" "}
              지점을 영구 삭제합니다. 등록된 벽이 있으면 거부돼요. 보통은{" "}
              <strong className="text-ink-900">비활성</strong>으로 전환하시는
              것을 권장합니다.
            </>
          ) : null
        }
        onConfirm={() => {
          const g = deleteGymTarget
          setDeleteGymTarget(null)
          if (g) deleteGymConfirmed(g)
        }}
        onCancel={() => setDeleteGymTarget(null)}
      />

      <TextInputDialog
        open={addingForGymId !== null}
        title="새 벽 추가"
        subtitle={
          addingForGymId
            ? `${gyms.find((g) => g.id === addingForGymId)?.name ?? ""}점에 벽을 추가합니다`
            : undefined
        }
        placeholder="예: 1번 벽, 슬랩벽"
        confirmLabel="추가"
        onConfirm={(name) => {
          const gymId = addingForGymId
          setAddingForGymId(null)
          if (gymId) addWallWithName(gymId, name)
        }}
        onCancel={() => setAddingForGymId(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="벽을 삭제할까요?"
        variant="danger"
        confirmLabel="삭제"
        message={
          deleteTarget ? (
            <>
              <strong className="text-ink-900">{deleteTarget.name}</strong> 벽과
              연결된 모든 색의 문제 수가 함께 삭제됩니다. 이 작업은 되돌릴 수
              없어요.
            </>
          ) : null
        }
        onConfirm={() => {
          const w = deleteTarget
          setDeleteTarget(null)
          if (w) deleteWallConfirmed(w)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  )
}

function WallRow({
  wall,
  counts,
  grades,
  onRename,
  onCountChange,
  onDelete,
}: {
  wall: Wall
  counts: Record<string, number>
  grades: GradeMeta[]
  onRename: (name: string) => void
  onCountChange: (grade: string, raw: string | number) => void
  onDelete: () => void
}) {
  return (
    <li className="px-5 py-3 hover:bg-mute/30 transition group">
      <div
        className="flex flex-col sm:grid gap-3 sm:items-center"
        style={{
          gridTemplateColumns: `minmax(0,1fr) repeat(${grades.length}, 8.5rem) 2.5rem`,
        }}
      >
        <input
          type="text"
          value={wall.name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="벽 이름"
          className="w-full px-3 py-2.5 bg-mute focus:bg-surface border border-transparent focus:border-ink-900 rounded-lg outline-none text-sm font-bold transition"
        />
        <div
          className="grid sm:contents gap-2"
          style={{ gridTemplateColumns: `repeat(${grades.length}, minmax(0, 1fr))` }}
        >
          {grades.map((g) => (
            <Stepper
              key={g.key}
              grade={g}
              value={counts[`${wall.id}:${g.key}`] ?? 0}
              onChange={(v) => onCountChange(g.key, v)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="hidden sm:flex w-9 h-9 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft items-center justify-center transition shrink-0 ml-auto"
          aria-label="삭제"
          title="삭제"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="sm:hidden text-xs font-bold text-ink-500 hover:text-accent transition py-1"
        >
          ✕ 이 벽 삭제
        </button>
      </div>
    </li>
  )
}

function Stepper({
  grade,
  value,
  onChange,
}: {
  grade: { key: string; label: string; color: string }
  value: number
  onChange: (v: number) => void
}) {
  const isZero = value === 0
  const bg = softBg(grade.color)
  return (
    <div
      className={`flex items-center rounded-lg border transition ${
        isZero ? "border-line bg-surface" : "border-transparent"
      }`}
      style={!isZero ? { background: bg, borderColor: grade.color } : undefined}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        className="w-9 h-10 rounded-l-lg flex items-center justify-center text-base font-black hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
        style={!isZero ? { color: grade.color } : { color: "#A1A1A1" }}
        aria-label={`${grade.label} 감소`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={0}
        max={99}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        onFocus={(e) => e.target.select()}
        className={`flex-1 min-w-0 w-full text-center font-black num text-sm bg-transparent outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          isZero ? "text-ink-300" : ""
        }`}
        style={!isZero ? { color: grade.color } : undefined}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        className="w-9 h-10 rounded-r-lg flex items-center justify-center text-base font-black hover:bg-black/5 disabled:opacity-30 transition"
        style={{ color: grade.color }}
        aria-label={`${grade.label} 증가`}
      >
        +
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2 shadow-soft">
      <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold">
        {label}
      </div>
      <div className="text-base font-black num leading-none mt-1">{value}</div>
    </div>
  )
}

function SaveBar({
  state,
  savedAt,
  error,
}: {
  state: SaveState
  savedAt: Date | null
  error: string
}) {
  let cls = "bg-mute text-ink-500 border-line"
  let dot = "bg-ink-300"
  let text: React.ReactNode = "변경사항이 자동 저장됩니다"
  if (state === "saving") {
    cls = "bg-accent-soft text-accent border-accent/30"
    dot = "bg-accent animate-pulse"
    text = "저장 중..."
  } else if (state === "saved") {
    cls = "bg-grade-green/10 text-grade-green border-grade-green/30"
    dot = "bg-grade-green"
    text = (
      <>
        모든 변경사항 저장됨{savedAt && relTime(savedAt)}
      </>
    )
  } else if (state === "error") {
    cls = "bg-accent-soft text-accent border-accent/40"
    dot = "bg-accent"
    text = error || "저장 실패"
  }
  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-black ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </div>
  )
}

function relTime(d: Date) {
  const diff = Math.round((Date.now() - d.getTime()) / 1000)
  if (diff < 5) return " · 방금 전"
  if (diff < 60) return ` · ${diff}초 전`
  return ` · ${Math.floor(diff / 60)}분 전`
}
