"use client"

import { useMemo, useState } from "react"
import { CATEGORY_META, GRADE_COLOR, GRADE_LABEL } from "@/lib/contest/grades"

export type ParticipantRow = {
  id: string
  display_name: string
  main_grade: string
  category: string
  participant_type: string
  paid: boolean
  created_at: string
}

type Filter = "all" | "unpaid" | "paid"

const CATEGORY_ORDER = ["advanced", "intermediate", "beginner"] as const

export function ParticipantList({ rows }: { rows: ParticipantRow[] }) {
  const [data, setData] = useState(rows)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [pending, setPending] = useState<Set<string>>(new Set())

  const stats = useMemo(() => {
    const total = data.length
    const paid = data.filter((r) => r.paid).length
    const unpaid = total - paid
    const byCat: Record<string, number> = {}
    for (const r of data) byCat[r.category] = (byCat[r.category] ?? 0) + 1
    return { total, paid, unpaid, byCat }
  }, [data])

  const filtered = useMemo(() => {
    let list = data
    if (filter === "paid") list = list.filter((r) => r.paid)
    if (filter === "unpaid") list = list.filter((r) => !r.paid)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((r) => r.display_name.toLowerCase().includes(q))
    }
    return list
  }, [data, filter, query])

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, ParticipantRow[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const r of filtered) {
      if (!map.has(r.category)) map.set(r.category, [])
      map.get(r.category)!.push(r)
    }
    return map
  }, [filtered])

  async function togglePaid(row: ParticipantRow) {
    const next = !row.paid
    setData((d) => d.map((r) => (r.id === row.id ? { ...r, paid: next } : r)))
    setPending((p) => new Set(p).add(row.id))
    try {
      const res = await fetch(`/api/admin/participants/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: next }),
      })
      if (!res.ok) throw new Error("저장 실패")
    } catch (err) {
      console.error(err)
      setData((d) => d.map((r) => (r.id === row.id ? { ...r, paid: !next } : r)))
      window.alert("입금 상태 저장에 실패했어요")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 pb-20">
      {/* Header */}
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          STEP 2
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          참가자 · 입금 확인
        </h1>
        <p className="text-sm text-ink-700 mt-1.5">
          신청한 참가자를 확인하고 입금 완료를 표시합니다.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        <Stat label="전체" value={stats.total} />
        <Stat label="입금 완료" value={stats.paid} accent="green" />
        <Stat label="입금 대기" value={stats.unpaid} accent="red" />
        <Stat label="상급" value={stats.byCat.advanced ?? 0} />
        <Stat label="중급/초급" value={(stats.byCat.intermediate ?? 0) + (stats.byCat.beginner ?? 0)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {stats.total}
        </FilterChip>
        <FilterChip
          active={filter === "unpaid"}
          onClick={() => setFilter("unpaid")}
          accent
        >
          입금 대기 {stats.unpaid}
        </FilterChip>
        <FilterChip active={filter === "paid"} onClick={() => setFilter("paid")}>
          입금 완료 {stats.paid}
        </FilterChip>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 검색..."
          className="ml-auto px-3 py-2 bg-surface border border-line focus:border-ink-900 rounded-lg outline-none text-sm font-bold transition w-full sm:w-48 placeholder:font-normal placeholder:text-ink-300"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-500">
          {data.length === 0
            ? "아직 신청한 참가자가 없어요."
            : "조건에 맞는 참가자가 없어요."}
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map((cat) => {
            const list = groupedByCategory.get(cat) ?? []
            if (list.length === 0) return null
            const meta = CATEGORY_META[cat]
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-2 px-1">
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
                  <span className="text-xs text-ink-500 font-bold num">
                    {list.length}명
                  </span>
                </div>
                <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-soft">
                  <ul className="divide-y divide-line">
                    {list.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-mute/40 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black truncate">
                              {row.display_name}
                            </span>
                            <span className="text-[10px] font-bold text-ink-500 px-1.5 py-0.5 rounded bg-mute">
                              {row.participant_type === "crew" ? "꽉크루" : "게스트"}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{
                                color: GRADE_COLOR[row.main_grade] ?? "#6B7280",
                                borderColor:
                                  GRADE_COLOR[row.main_grade] ?? "#6B7280",
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background:
                                    GRADE_COLOR[row.main_grade] ?? "#6B7280",
                                }}
                              />
                              평소 {GRADE_LABEL[row.main_grade] ?? row.main_grade}
                            </span>
                          </div>
                          <div className="text-[11px] text-ink-500 mt-0.5 num">
                            {new Date(row.created_at).toLocaleDateString("ko-KR", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <PaidToggle
                          paid={row.paid}
                          loading={pending.has(row.id)}
                          onToggle={() => togglePaid(row)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: "green" | "red"
}) {
  const color =
    accent === "green"
      ? "text-grade-green"
      : accent === "red"
      ? "text-accent"
      : "text-ink-900"
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2.5 shadow-soft">
      <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold">
        {label}
      </div>
      <div className={`text-xl font-black num leading-tight mt-0.5 ${color}`}>
        {value}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean
  onClick: () => void
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-black px-3 py-1.5 rounded-full border transition ${
        active
          ? accent
            ? "bg-accent text-white border-accent shadow-pop"
            : "bg-ink-900 text-white border-ink-900"
          : "bg-surface text-ink-700 border-line hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  )
}

function PaidToggle({
  paid,
  loading,
  onToggle,
}: {
  paid: boolean
  loading: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition active:scale-95 ${
        paid
          ? "bg-grade-green/10 text-grade-green border border-grade-green/30 hover:bg-grade-green/20"
          : "bg-accent text-white border border-accent shadow-pop hover:bg-accent/90"
      } ${loading ? "opacity-60 cursor-wait" : ""}`}
    >
      {loading ? "저장중..." : paid ? "✓ 입금완료" : "입금 대기"}
    </button>
  )
}
