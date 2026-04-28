"use client"

import { useEffect, useMemo, useState } from "react"
import { CATEGORY_META, GRADE_COLOR, GRADE_LABEL } from "@/lib/contest/grades"
import { Modal } from "@/components/Modal"
import { ConfirmDialog } from "@/components/ConfirmDialog"

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
  const [toast, setToast] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<ParticipantRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ParticipantRow | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function saveEdit(
    id: string,
    patch: Partial<Omit<ParticipantRow, "id" | "created_at">>,
  ) {
    const prev = data.find((r) => r.id === id)
    if (!prev) return
    setData((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setPending((p) => new Set(p).add(id))
    try {
      const res = await fetch(`/api/admin/participants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "수정 실패")
      }
    } catch (err) {
      setData((d) => d.map((r) => (r.id === id ? prev : r)))
      showToast(err instanceof Error ? err.message : "수정 실패")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(id)
        return next
      })
    }
  }

  async function deleteParticipant(row: ParticipantRow) {
    setPending((p) => new Set(p).add(row.id))
    try {
      const res = await fetch(`/api/admin/participants/${row.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "삭제 실패")
      }
      setData((d) => d.filter((r) => r.id !== row.id))
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

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
      showToast("입금 상태 저장에 실패했어요. 잠시 후 다시 시도해주세요.")
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-pop max-w-sm text-center">
          {toast}
        </div>
      )}

      <ParticipantEditDialog
        open={editTarget !== null}
        row={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={async (patch) => {
          if (editTarget) await saveEdit(editTarget.id, patch)
          setEditTarget(null)
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 참가자를 삭제할까요?"
        variant="danger"
        confirmLabel="완전 삭제"
        message={
          deleteTarget ? (
            <>
              <strong className="text-ink-900">{deleteTarget.display_name}</strong>{" "}
              참가자와 그가 입력한 모든 풀이 기록이 영구 삭제됩니다. 되돌릴 수 없어요.
            </>
          ) : null
        }
        onConfirm={() => {
          const t = deleteTarget
          setDeleteTarget(null)
          if (t) deleteParticipant(t)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

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
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          disabled={pending.has(row.id)}
                          className="shrink-0 w-9 h-9 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-mute flex items-center justify-center transition disabled:opacity-40"
                          aria-label="수정"
                          title="수정"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          disabled={pending.has(row.id)}
                          className="shrink-0 w-9 h-9 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition disabled:opacity-40"
                          aria-label="삭제"
                          title="삭제"
                        >
                          ✕
                        </button>
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

type EditPatch = {
  display_name?: string
  main_grade?: string
  category?: string
  participant_type?: string
}

const GRADE_OPTIONS = [
  { value: "purple", label: "보라", color: "#9333EA", bg: "#FAF5FF" },
  { value: "pink", label: "핑크", color: "#DB2777", bg: "#FDF2F8" },
  { value: "red", label: "빨강", color: "#DC2626", bg: "#FEF2F2" },
  { value: "blue", label: "파랑", color: "#2563EB", bg: "#EFF6FF" },
] as const

const CATEGORY_OPTIONS = [
  { value: "advanced", label: "상급", solveLabel: "빨강 풀이", color: "#DC2626", bg: "#FEF2F2" },
  { value: "intermediate", label: "중급", solveLabel: "파랑 풀이", color: "#2563EB", bg: "#EFF6FF" },
  { value: "beginner", label: "초급", solveLabel: "초록 풀이", color: "#16A34A", bg: "#F0FDF4" },
] as const

const TYPE_OPTIONS = [
  { value: "crew", label: "꽉크루" },
  { value: "guest", label: "게스트" },
] as const

function ParticipantEditDialog({
  open,
  row,
  onClose,
  onSave,
}: {
  open: boolean
  row: ParticipantRow | null
  onClose: () => void
  onSave: (patch: EditPatch) => Promise<void> | void
}) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState<string>("")
  const [cat, setCat] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && row) {
      setName(row.display_name)
      setGrade(row.main_grade)
      setCat(row.category)
      setType(row.participant_type)
      setSaving(false)
    }
  }, [open, row])

  if (!row) return null

  const dirty =
    name.trim() !== row.display_name ||
    grade !== row.main_grade ||
    cat !== row.category ||
    type !== row.participant_type

  async function submit() {
    if (!dirty || !name.trim()) {
      onClose()
      return
    }
    if (!row) return
    const patch: EditPatch = {}
    if (name.trim() !== row.display_name) patch.display_name = name.trim()
    if (grade !== row.main_grade) patch.main_grade = grade
    if (cat !== row.category) patch.category = cat
    if (type !== row.participant_type) patch.participant_type = type
    setSaving(true)
    await onSave(patch)
    setSaving(false)
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="참가자 정보 수정">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-black">참가자 정보 수정</h2>
          <p className="text-xs text-ink-500 mt-0.5 num">
            가입일 ·{" "}
            {new Date(row.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-mute hover:bg-line transition flex items-center justify-center text-ink-700"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-black text-ink-700 mb-2 uppercase tracking-wider">
          이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-bold transition"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-black text-ink-700 mb-2 uppercase tracking-wider">
          평소 푸는 색
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {GRADE_OPTIONS.map((g) => {
            const active = grade === g.value
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setGrade(g.value)}
                className="py-3 rounded-xl border-2 font-black text-sm transition"
                style={
                  active
                    ? {
                        color: "#fff",
                        background: g.color,
                        borderColor: g.color,
                      }
                    : {
                        color: g.color,
                        background: g.bg,
                        borderColor: "transparent",
                      }
                }
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-black text-ink-700 mb-2 uppercase tracking-wider">
          난이도 (카테고리)
        </label>
        <div className="space-y-1.5">
          {CATEGORY_OPTIONS.map((c) => {
            const active = cat === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCat(c.value)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition"
                style={
                  active
                    ? { background: c.bg, borderColor: c.color }
                    : { background: "#fff", borderColor: "#E7E4DD" }
                }
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                  style={{
                    background: active ? c.color : c.bg,
                    color: active ? "#fff" : c.color,
                  }}
                >
                  {c.label[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-black text-sm"
                    style={{ color: active ? c.color : "#0A0A0A" }}
                  >
                    {c.label}조
                  </div>
                  <div className="text-[11px] text-ink-500 font-bold">
                    {c.solveLabel}
                  </div>
                </div>
                {active && (
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                    style={{ background: c.color }}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-[11px] font-black text-ink-700 mb-2 uppercase tracking-wider">
          참가 유형
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {TYPE_OPTIONS.map((t) => {
            const active = type === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`py-3 rounded-xl border-2 font-black text-sm transition ${
                  active
                    ? "bg-ink-900 text-white border-ink-900"
                    : "bg-surface text-ink-700 border-line hover:border-line-strong"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="py-3.5 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || !name.trim()}
          className="py-3.5 rounded-xl bg-accent text-white font-black text-sm hover:bg-accent/90 transition shadow-pop disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {saving ? "저장 중..." : dirty ? "저장" : "닫기"}
        </button>
      </div>
    </Modal>
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
