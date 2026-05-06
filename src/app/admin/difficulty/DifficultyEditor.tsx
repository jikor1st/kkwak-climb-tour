"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  Grade,
  Division,
  RankingGroup,
  DivisionRecommendation,
} from "@/lib/contest/grades"
import { Modal } from "@/components/Modal"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { TextInputDialog } from "@/components/TextInputDialog"
import {
  DndContext,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function softBg(hex: string): string {
  const h = hex.replace("#", "")
  if (h.length !== 6) return "#F4F4F4"
  return `#${h}1A`
}

type Props = {
  grades: Grade[]
  rankingGroups: RankingGroup[]
  divisions: Division[]
  recommendations: DivisionRecommendation[]
}

export function DifficultyEditor({
  grades: initGrades,
  rankingGroups: initGroups,
  divisions: initDivisions,
  recommendations: initRecs,
}: Props) {
  const [grades, setGrades] = useState<Grade[]>(initGrades)
  const [groups, setGroups] = useState<RankingGroup[]>(initGroups)
  const [divisions, setDivisions] = useState<Division[]>(initDivisions)
  const [recs, setRecs] = useState<DivisionRecommendation[]>(initRecs)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [addGradeOpen, setAddGradeOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [addDivisionOpen, setAddDivisionOpen] = useState(false)
  const [editGrade, setEditGrade] = useState<Grade | null>(null)
  const [editDivision, setEditDivision] = useState<Division | null>(null)
  const [editGroup, setEditGroup] = useState<RankingGroup | null>(null)
  const [deleteGrade, setDeleteGrade] = useState<Grade | null>(null)
  const [deleteDivision, setDeleteDivision] = useState<Division | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<RankingGroup | null>(null)

  const gradeMap = useMemo(
    () => Object.fromEntries(grades.map((g) => [g.id, g])),
    [grades],
  )
  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups],
  )
  const recMap = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const r of recs) {
      const set = m.get(r.challenge_grade) ?? new Set<string>()
      set.add(r.division_id)
      m.set(r.challenge_grade, set)
    }
    return m
  }, [recs])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function api(path: string, init: RequestInit) {
    setPending(true)
    try {
      const res = await fetch(path, init)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "요청 실패")
      return data
    } finally {
      setPending(false)
    }
  }

  // ============== Grades ==============
  async function createGrade(form: {
    id: string
    label: string
    color_hex: string
  }) {
    try {
      const data = await api("/api/admin/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sort_order: grades.length + 1 }),
      })
      setGrades((gs) => [...gs, data.grade])
      showToast(`${data.grade.label} 추가됨`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "생성 실패")
    }
  }

  async function patchGrade(id: string, patch: Partial<Grade>) {
    const prev = grades
    setGrades((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    try {
      await api(`/api/admin/grades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    } catch (err) {
      setGrades(prev)
      showToast(err instanceof Error ? err.message : "수정 실패")
    }
  }

  async function removeGrade(id: string) {
    try {
      await api(`/api/admin/grades/${id}`, { method: "DELETE" })
      setGrades((gs) => gs.filter((g) => g.id !== id))
      showToast("색 삭제됨")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    }
  }

  // ============== Ranking groups ==============
  async function createGroup(name: string) {
    try {
      const data = await api("/api/admin/ranking-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      setGroups((gs) => [...gs, data.ranking_group])
      showToast(`${data.ranking_group.name} 추가됨`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "생성 실패")
    }
  }

  async function patchGroup(id: string, patch: Partial<RankingGroup>) {
    const prev = groups
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    try {
      await api(`/api/admin/ranking-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    } catch (err) {
      setGroups(prev)
      showToast(err instanceof Error ? err.message : "수정 실패")
    }
  }

  async function removeGroup(id: string) {
    try {
      await api(`/api/admin/ranking-groups/${id}`, { method: "DELETE" })
      setGroups((gs) => gs.filter((g) => g.id !== id))
      showToast("랭킹 그룹 삭제됨")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    }
  }

  // ============== Divisions ==============
  async function createDivision(form: {
    label: string
    solve_grade: string
    ranking_group_id: string | null
    desc_text: string
  }) {
    try {
      const data = await api("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setDivisions((ds) => [...ds, data.division])
      showToast(`${data.division.label} 추가됨`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "생성 실패")
    }
  }

  async function patchDivision(id: string, patch: Partial<Division>) {
    const prev = divisions
    setDivisions((ds) =>
      ds.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    )
    try {
      await api(`/api/admin/divisions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    } catch (err) {
      setDivisions(prev)
      showToast(err instanceof Error ? err.message : "수정 실패")
    }
  }

  async function removeDivision(id: string) {
    try {
      await api(`/api/admin/divisions/${id}`, { method: "DELETE" })
      setDivisions((ds) => ds.filter((d) => d.id !== id))
      showToast("부 삭제됨")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    }
  }

  // ============== Reorder ==============
  const sortedGradesEarly = useMemo(
    () => [...grades].sort((a, b) => a.sort_order - b.sort_order),
    [grades],
  )
  const sortedDivisionsEarly = useMemo(
    () => [...divisions].sort((a, b) => a.sort_order - b.sort_order),
    [divisions],
  )
  // 모바일에서 드래그가 스크롤로 새는 문제 — 마우스/터치를 분리해 처리한다.
  // - MouseSensor: 데스크탑 즉시 활성 (5px 이동)
  // - TouchSensor: 250ms 길게 눌러야 활성 (그 안에 손가락이 5px 이상 움직이면
  //   드래그 취소되어 스크롤로 흘러감 — UX 자연스러움)
  // PointerSensor 단독은 두 입력의 임계치를 맞추기 어려워 권장 안 함.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function reorderGrades(ids: string[]) {
    const prev = grades
    const next = ids
      .map((id, i) => {
        const g = grades.find((x) => x.id === id)
        return g ? { ...g, sort_order: i + 1 } : null
      })
      .filter((g): g is Grade => g !== null)
    setGrades(next)
    try {
      await api("/api/admin/grades/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
    } catch (err) {
      setGrades(prev)
      showToast(err instanceof Error ? err.message : "순서 저장 실패")
    }
  }

  async function reorderDivisions(ids: string[]) {
    const prev = divisions
    const next = ids
      .map((id, i) => {
        const d = divisions.find((x) => x.id === id)
        return d ? { ...d, sort_order: i + 1 } : null
      })
      .filter((d): d is Division => d !== null)
    setDivisions(next)
    try {
      await api("/api/admin/divisions/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
    } catch (err) {
      setDivisions(prev)
      showToast(err instanceof Error ? err.message : "순서 저장 실패")
    }
  }

  function handleGradeDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = sortedGradesEarly.map((g) => g.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    reorderGrades(arrayMove(ids, oldIndex, newIndex))
  }

  function handleDivisionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = sortedDivisionsEarly.map((d) => d.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    reorderDivisions(arrayMove(ids, oldIndex, newIndex))
  }

  // ============== Recommendations ==============
  async function setRecommendation(challenge_grade: string, division_ids: string[]) {
    const prev = recs
    setRecs(() => {
      const filtered = prev.filter((r) => r.challenge_grade !== challenge_grade)
      return [
        ...filtered,
        ...division_ids.map((division_id) => ({ challenge_grade, division_id })),
      ]
    })
    try {
      await api("/api/admin/division-recommendations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_grade, division_ids }),
      })
    } catch (err) {
      setRecs(prev)
      showToast(err instanceof Error ? err.message : "저장 실패")
    }
  }

  function toggleRecommendation(challenge_grade: string, division_id: string) {
    const set = recMap.get(challenge_grade) ?? new Set<string>()
    const next = new Set(set)
    if (next.has(division_id)) next.delete(division_id)
    else next.add(division_id)
    setRecommendation(challenge_grade, [...next])
  }

  const sortedGrades = sortedGradesEarly
  const sortedDivisions = sortedDivisionsEarly
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.sort_order - b.sort_order),
    [groups],
  )

  function renderDivisionRow(d: Division, allGroups: RankingGroup[]) {
    const grade = gradeMap[d.solve_grade]
    const color = grade?.color_hex ?? "#6B7280"
    return (
      <SortableDivisionTreeRow
        key={d.id}
        division={d}
        color={color}
        gradeLabel={grade?.label ?? d.solve_grade}
        groups={allGroups}
        onChangeGroup={(groupId) =>
          patchDivision(d.id, { ranking_group_id: groupId })
        }
        onToggleActive={() => patchDivision(d.id, { active: !d.active })}
        onEdit={() => setEditDivision(d)}
        onDelete={() => setDeleteDivision(d)}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 pb-20">
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          STEP 0 · 시스템
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          난이도 시스템
        </h1>
      </div>

      {/* 개념 흐름도 */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-soft mb-4">
        <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-3">
          이렇게 연결돼요
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 sm:gap-3 items-center">
          <FlowStep
            n="1"
            title="색"
            desc="빨강·핑크 등 난이도"
            tone="grade"
          />
          <FlowArrow />
          <FlowStep
            n="2"
            title="부"
            desc="각 부가 한 색을 풀이"
            tone="division"
          />
          <FlowArrow />
          <FlowStep
            n="3"
            title="그룹"
            desc="여러 부의 풀이율 합산 랭킹"
            tone="group"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 sm:gap-3 items-center mt-2">
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
          <FlowStep
            n="추천"
            title="평소 색 → 부"
            desc="신청 시 추천 부 표시"
            tone="recommend"
            small
          />
          <div className="hidden sm:block" />
          <div className="hidden sm:block" />
        </div>
      </div>

      {/* 라이브 미리보기 */}
      <SignupPreview
        grades={sortedGrades}
        divisions={sortedDivisions}
        groups={sortedGroups}
        recMap={recMap}
        gradeMap={gradeMap}
        groupMap={groupMap}
      />

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900/85 backdrop-blur-md backdrop-saturate-150 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-pop max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Grades — compact horizontal */}
      <Section
        title="1. 색"
        desc="신청 시 평소 푸는 색·부의 풀이 색에 사용. 드래그로 순서 변경."
        right={
          <button
            type="button"
            onClick={() => setAddGradeOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-black shadow-pop hover:bg-accent/90 transition"
          >
            + 색
          </button>
        }
      >
        <DndContext
          id="difficulty-grades"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGradeDragEnd}
        >
          <SortableContext
            items={sortedGrades.map((g) => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-wrap gap-1.5">
              {sortedGrades.map((g) => (
                <CompactGradePill
                  key={g.id}
                  grade={g}
                  usageCount={
                    divisions.filter((d) => d.solve_grade === g.id).length
                  }
                  onEdit={() => setEditGrade(g)}
                  onDelete={() => setDeleteGrade(g)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Section>

      {/* Tree: ranking groups + nested divisions */}
      <Section
        title="2. 부 · 랭킹 그룹"
        desc="각 부는 색 하나를 풉니다. 같은 그룹의 부들은 풀이율(%)로 합산 랭킹."
        right={
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAddDivisionOpen(true)}
              disabled={grades.length === 0}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-black shadow-pop hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + 부
            </button>
            <button
              type="button"
              onClick={() => setAddGroupOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-black hover:bg-ink-700 transition"
            >
              + 그룹
            </button>
          </div>
        }
      >
        <DndContext
          id="difficulty-divisions"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDivisionDragEnd}
        >
          <div className="space-y-3">
            {sortedGroups.map((g) => {
              const inGroup = sortedDivisions.filter(
                (d) => d.ranking_group_id === g.id,
              )
              return (
                <GroupContainer
                  key={g.id}
                  groupName={g.name}
                  divisionCount={inGroup.length}
                  onRename={() => setEditGroup(g)}
                  onDelete={() => setDeleteGroup(g)}
                >
                  <SortableContext
                    items={inGroup.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {inGroup.length === 0 ? (
                      <div className="text-[11px] text-ink-500 text-center py-3">
                        아직 부가 없어요. 다른 그룹의 부를 옮기거나 + 부로 새로 만드세요.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {inGroup.map((d) =>
                          renderDivisionRow(d, sortedGroups),
                        )}
                      </ul>
                    )}
                  </SortableContext>
                </GroupContainer>
              )
            })}

            {(() => {
              const unassigned = sortedDivisions.filter(
                (d) => d.ranking_group_id === null,
              )
              if (unassigned.length === 0) return null
              return (
                <GroupContainer
                  groupName="미지정 부"
                  divisionCount={unassigned.length}
                  variant="muted"
                >
                  <SortableContext
                    items={unassigned.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-1.5">
                      {unassigned.map((d) =>
                        renderDivisionRow(d, sortedGroups),
                      )}
                    </ul>
                  </SortableContext>
                </GroupContainer>
              )
            })()}
          </div>
        </DndContext>
      </Section>

      {/* Recommendations matrix */}
      <Section
        title="3. 추천 매핑 (선택)"
        desc="신청 시 사용자가 평소 색을 고르면 ✓ 표시된 부에 '추천' 라벨이 붙어요."
      >
        {sortedDivisions.length === 0 || sortedGrades.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl p-5 text-center text-sm text-ink-500">
            색과 부를 먼저 등록해주세요.
          </div>
        ) : (
          <RecommendationMatrix
            grades={sortedGrades}
            divisions={sortedDivisions}
            gradeMap={gradeMap}
            recMap={recMap}
            onToggle={toggleRecommendation}
            disabled={pending}
          />
        )}
      </Section>

      {/* dialogs */}
      <GradeFormDialog
        open={addGradeOpen}
        onClose={() => setAddGradeOpen(false)}
        onSubmit={async (form) => {
          await createGrade(form)
          setAddGradeOpen(false)
        }}
      />
      <GradeEditDialog
        grade={editGrade}
        onClose={() => setEditGrade(null)}
        onSubmit={async (patch) => {
          if (editGrade) await patchGrade(editGrade.id, patch)
          setEditGrade(null)
        }}
      />
      <ConfirmDialog
        open={deleteGrade !== null}
        title="이 색을 삭제할까요?"
        variant="danger"
        confirmLabel="삭제"
        message={
          deleteGrade ? (
            <>
              <strong className="text-ink-900">{deleteGrade.label}</strong>{" "}
              색을 삭제합니다. 사용 중이면 거부돼요.
            </>
          ) : null
        }
        onConfirm={() => {
          const g = deleteGrade
          setDeleteGrade(null)
          if (g) removeGrade(g.id)
        }}
        onCancel={() => setDeleteGrade(null)}
      />

      <TextInputDialog
        open={addGroupOpen}
        title="새 랭킹 그룹"
        placeholder="예: 1그룹"
        confirmLabel="추가"
        onConfirm={(name) => {
          setAddGroupOpen(false)
          if (name.trim()) createGroup(name.trim())
        }}
        onCancel={() => setAddGroupOpen(false)}
      />
      <TextInputDialog
        open={editGroup !== null}
        title="랭킹 그룹 이름"
        placeholder="예: 1그룹"
        confirmLabel="저장"
        initialValue={editGroup?.name ?? ""}
        onConfirm={(name) => {
          const g = editGroup
          setEditGroup(null)
          if (g && name.trim()) patchGroup(g.id, { name: name.trim() })
        }}
        onCancel={() => setEditGroup(null)}
      />
      <ConfirmDialog
        open={deleteGroup !== null}
        title="이 랭킹 그룹을 삭제할까요?"
        variant="danger"
        confirmLabel="삭제"
        message={
          deleteGroup ? (
            <>
              <strong className="text-ink-900">{deleteGroup.name}</strong>{" "}
              그룹을 삭제합니다. 속한 부가 있으면 거부돼요.
            </>
          ) : null
        }
        onConfirm={() => {
          const g = deleteGroup
          setDeleteGroup(null)
          if (g) removeGroup(g.id)
        }}
        onCancel={() => setDeleteGroup(null)}
      />

      <DivisionFormDialog
        open={addDivisionOpen}
        grades={sortedGrades}
        groups={sortedGroups}
        onClose={() => setAddDivisionOpen(false)}
        onSubmit={async (form) => {
          await createDivision(form)
          setAddDivisionOpen(false)
        }}
      />
      <DivisionEditDialog
        division={editDivision}
        grades={sortedGrades}
        groups={sortedGroups}
        onClose={() => setEditDivision(null)}
        onSubmit={async (patch) => {
          if (editDivision) await patchDivision(editDivision.id, patch)
          setEditDivision(null)
        }}
      />
      <ConfirmDialog
        open={deleteDivision !== null}
        title="이 부를 삭제할까요?"
        variant="danger"
        confirmLabel="삭제"
        message={
          deleteDivision ? (
            <>
              <strong className="text-ink-900">{deleteDivision.label}</strong>{" "}
              부를 삭제합니다. 참가자가 있으면 거부돼요. 보통은 비활성으로 전환을 권장.
            </>
          ) : null
        }
        onConfirm={() => {
          const d = deleteDivision
          setDeleteDivision(null)
          if (d) removeDivision(d.id)
        }}
        onCancel={() => setDeleteDivision(null)}
      />
    </div>
  )
}

function Section({
  title,
  desc,
  right,
  children,
}: {
  title: string
  desc?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      {/* 모바일: 타이틀 위, 액션 버튼 아래로 분리해 좁은 폭에서도 버튼이
          줄바꿈되지 않도록. 데스크탑에선 기존 가로 정렬 유지. */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3 mb-3 px-1">
        <div className="min-w-0">
          <h2 className="text-base font-black">{title}</h2>
          {desc && <p className="text-xs text-ink-500 mt-0.5">{desc}</p>}
        </div>
        {right && <div className="flex flex-wrap gap-1.5">{right}</div>}
      </div>
      {children}
    </section>
  )
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

function GradeFormDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (form: { id: string; label: string; color_hex: string }) => Promise<void>
}) {
  const [id, setId] = useState("")
  const [label, setLabel] = useState("")
  const [color, setColor] = useState("#888888")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const ok = !!(
    id.trim() &&
    label.trim() &&
    HEX_RE.test(color.trim()) &&
    /^[a-z][a-z0-9_-]{0,31}$/.test(id.trim())
  )

  return (
    <Modal open={open} onClose={onClose} ariaLabel="새 색 추가">
      <h2 className="text-lg font-black mb-4">새 색 추가</h2>
      <Field label="ID (영문 소문자/숫자/_-)">
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value.toLowerCase())}
          placeholder="예: orange"
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <Field label="이름 (한글)">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={16}
          placeholder="예: 주황"
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <Field label="색 (#RRGGBB)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={HEX_RE.test(color) ? color : "#888888"}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded-lg border border-line"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold num"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-3 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!ok || saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSubmit({ id: id.trim(), label: label.trim(), color_hex: color.trim() })
              setId("")
              setLabel("")
              setColor("#888888")
            } finally {
              setSaving(false)
            }
          }}
          className="py-3 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "저장 중..." : "추가"}
        </button>
      </div>
    </Modal>
  )
}

function GradeEditDialog({
  grade,
  onClose,
  onSubmit,
}: {
  grade: Grade | null
  onClose: () => void
  onSubmit: (patch: Partial<Grade>) => Promise<void>
}) {
  if (!grade) return null
  return <GradeEditBody grade={grade} onClose={onClose} onSubmit={onSubmit} />
}

function GradeEditBody({
  grade,
  onClose,
  onSubmit,
}: {
  grade: Grade
  onClose: () => void
  onSubmit: (patch: Partial<Grade>) => Promise<void>
}) {
  const [label, setLabel] = useState(grade.label)
  const [color, setColor] = useState(grade.color_hex)
  const [saving, setSaving] = useState(false)

  const ok = !!(label.trim() && HEX_RE.test(color.trim()))
  const dirty = label.trim() !== grade.label || color.trim() !== grade.color_hex

  return (
    <Modal open onClose={onClose} ariaLabel="색 수정">
      <h2 className="text-lg font-black mb-4">{grade.label} 수정</h2>
      <Field label="이름">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={16}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <Field label="색 (#RRGGBB)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={HEX_RE.test(color) ? color : "#888888"}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded-lg border border-line"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold num"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-3 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!ok || !dirty || saving}
          onClick={async () => {
            setSaving(true)
            try {
              const patch: Partial<Grade> = {}
              if (label.trim() !== grade.label) patch.label = label.trim()
              if (color.trim() !== grade.color_hex) patch.color_hex = color.trim()
              await onSubmit(patch)
            } finally {
              setSaving(false)
            }
          }}
          className="py-3 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </Modal>
  )
}

type DivisionFormProps = {
  open: boolean
  grades: Grade[]
  groups: RankingGroup[]
  onClose: () => void
  onSubmit: (form: {
    label: string
    solve_grade: string
    ranking_group_id: string | null
    desc_text: string
  }) => Promise<void>
}

function DivisionFormDialog(props: DivisionFormProps) {
  if (!props.open) return null
  return <DivisionFormBody {...props} />
}

function DivisionFormBody({
  grades,
  groups,
  onClose,
  onSubmit,
}: Omit<DivisionFormProps, "open">) {
  const [label, setLabel] = useState("")
  const [solveGrade, setSolveGrade] = useState<string>(grades[0]?.id ?? "")
  const [groupId, setGroupId] = useState<string>("")
  const [desc, setDesc] = useState("")
  const [saving, setSaving] = useState(false)

  const ok = !!(label.trim() && solveGrade)

  return (
    <Modal open onClose={onClose} ariaLabel="새 부 추가">
      <h2 className="text-lg font-black mb-4">새 부 추가</h2>
      <Field label="이름">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={20}
          placeholder="예: 핑크부"
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <Field label="이 부가 푸는 색">
        <select
          value={solveGrade}
          onChange={(e) => setSolveGrade(e.target.value)}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        >
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="랭킹 그룹">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        >
          <option value="">미지정</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="설명 (선택)">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="예: 핑크 풀이"
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-3 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!ok || saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSubmit({
                label: label.trim(),
                solve_grade: solveGrade,
                ranking_group_id: groupId || null,
                desc_text: desc,
              })
            } finally {
              setSaving(false)
            }
          }}
          className="py-3 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "저장 중..." : "추가"}
        </button>
      </div>
    </Modal>
  )
}

type DivisionEditProps = {
  division: Division | null
  grades: Grade[]
  groups: RankingGroup[]
  onClose: () => void
  onSubmit: (patch: Partial<Division>) => Promise<void>
}

function DivisionEditDialog(props: DivisionEditProps) {
  if (!props.division) return null
  return <DivisionEditBody {...props} division={props.division} />
}

function DivisionEditBody({
  division,
  grades,
  groups,
  onClose,
  onSubmit,
}: Omit<DivisionEditProps, "division"> & { division: Division }) {
  const [label, setLabel] = useState(division.label)
  const [solveGrade, setSolveGrade] = useState<string>(division.solve_grade)
  const [groupId, setGroupId] = useState<string>(division.ranking_group_id ?? "")
  const [desc, setDesc] = useState(division.desc_text)
  const [saving, setSaving] = useState(false)

  const dirty =
    label.trim() !== division.label ||
    solveGrade !== division.solve_grade ||
    (groupId || null) !== division.ranking_group_id ||
    desc !== division.desc_text

  return (
    <Modal open onClose={onClose} ariaLabel="부 수정">
      <h2 className="text-lg font-black mb-4">{division.label} 수정</h2>
      <Field label="이름">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={20}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <Field label="이 부가 푸는 색">
        <select
          value={solveGrade}
          onChange={(e) => setSolveGrade(e.target.value)}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        >
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="랭킹 그룹">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        >
          <option value="">미지정</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="설명">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-3 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!label.trim() || !dirty || saving}
          onClick={async () => {
            setSaving(true)
            try {
              const patch: Partial<Division> = {}
              if (label.trim() !== division.label) patch.label = label.trim()
              if (solveGrade !== division.solve_grade)
                patch.solve_grade = solveGrade
              const nextGroup = groupId || null
              if (nextGroup !== division.ranking_group_id)
                patch.ranking_group_id = nextGroup
              if (desc !== division.desc_text) patch.desc_text = desc
              await onSubmit(patch)
            } finally {
              setSaving(false)
            }
          }}
          className="py-3 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </Modal>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-black text-ink-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  )
}

function DragHandle({
  attributes,
  listeners,
}: {
  attributes: ReturnType<typeof useSortable>["attributes"]
  listeners: ReturnType<typeof useSortable>["listeners"]
}) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="w-7 h-9 rounded-md text-ink-300 hover:text-ink-700 hover:bg-mute transition flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
      aria-label="순서 변경"
    >
      ⋮⋮
    </button>
  )
}

function CompactGradePill({
  grade,
  usageCount,
  onEdit,
  onDelete,
}: {
  grade: Grade
  usageCount: number
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grade.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    touchAction: "none",
  }
  // 자식 버튼 클릭이 드래그로 잡히지 않게 pointerdown 전파 차단
  const stopDrag = (e: React.PointerEvent) => e.stopPropagation()
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group inline-flex items-center gap-1 bg-surface border border-line rounded-full pl-2 pr-1 py-1 cursor-grab active:cursor-grabbing select-none"
      title="드래그로 순서 변경"
    >
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ background: grade.color_hex }}
      />
      <span className="text-xs font-black">{grade.label}</span>
      {usageCount > 0 && (
        <span className="text-[10px] font-bold text-ink-500 num">
          ·{usageCount}
        </span>
      )}
      <button
        type="button"
        onPointerDown={stopDrag}
        onClick={onEdit}
        className="w-5 h-5 rounded-full text-ink-500 hover:text-ink-900 hover:bg-mute flex items-center justify-center transition ml-0.5"
        aria-label={`${grade.label} 수정`}
        title="수정"
      >
        ✎
      </button>
      <button
        type="button"
        onPointerDown={stopDrag}
        onClick={onDelete}
        className="w-5 h-5 rounded-full text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition opacity-0 group-hover:opacity-100"
        aria-label="삭제"
        title="삭제"
      >
        ✕
      </button>
    </div>
  )
}

function GroupContainer({
  groupName,
  divisionCount,
  variant = "default",
  onRename,
  onDelete,
  children,
}: {
  groupName: string
  divisionCount: number
  variant?: "default" | "muted"
  onRename?: () => void
  onDelete?: () => void
  children: React.ReactNode
}) {
  const isMuted = variant === "muted"
  return (
    <div
      className={`rounded-2xl border ${
        isMuted
          ? "bg-mute/40 border-dashed border-line-strong"
          : "bg-mute/30 border-line"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line/60">
        <span
          className={`w-1.5 h-5 rounded-full ${
            isMuted ? "bg-ink-300" : "bg-accent"
          }`}
        />
        <h3 className="font-black text-sm">{groupName}</h3>
        <span className="text-[10px] font-bold text-ink-500 num">
          · 부 {divisionCount}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="w-7 h-7 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface flex items-center justify-center transition"
              aria-label="이름 변경"
              title="이름 변경"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-7 h-7 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition"
              aria-label="삭제"
              title="삭제"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  )
}

function SortableDivisionTreeRow({
  division,
  color,
  gradeLabel,
  groups,
  onChangeGroup,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  division: Division
  color: string
  gradeLabel: string
  groups: RankingGroup[]
  onChangeGroup: (groupId: string | null) => void
  onToggleActive: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: division.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-surface border border-line rounded-xl px-2.5 py-2 ${
        !division.active ? "opacity-60" : ""
      }`}
    >
      <DragHandle attributes={attributes} listeners={listeners} />
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center font-black text-xs shrink-0 text-white"
        style={{ background: color }}
      >
        {division.label[0]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-sm truncate">{division.label}</span>
          <span className="text-[10px] font-bold text-ink-500">
            · {gradeLabel} 풀이
          </span>
          {!division.active && (
            <span className="text-[10px] font-black text-accent bg-accent-soft px-1.5 py-0.5 rounded">
              비활성
            </span>
          )}
        </div>
      </div>
      <select
        value={division.ranking_group_id ?? ""}
        onChange={(e) => onChangeGroup(e.target.value || null)}
        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-line bg-surface hover:bg-mute transition cursor-pointer"
        title="다른 그룹으로 이동"
      >
        <option value="">미지정</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleActive}
        className={`hidden sm:inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs transition ${
          division.active
            ? "text-grade-green hover:bg-grade-green/10"
            : "text-ink-300 hover:bg-mute"
        }`}
        aria-label={division.active ? "비활성화" : "활성화"}
        title={division.active ? "비활성화" : "활성화"}
      >
        {division.active ? "●" : "○"}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="w-7 h-7 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-mute flex items-center justify-center transition"
        aria-label="수정"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-7 h-7 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition"
        aria-label="삭제"
      >
        ✕
      </button>
    </li>
  )
}

function RecommendationMatrix({
  grades,
  divisions,
  gradeMap,
  recMap,
  onToggle,
  disabled,
}: {
  grades: Grade[]
  divisions: Division[]
  gradeMap: Record<string, Grade>
  recMap: Map<string, Set<string>>
  onToggle: (challengeGrade: string, divisionId: string) => void
  disabled: boolean
}) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-[10px] font-black text-ink-500 uppercase tracking-wider px-3 py-2.5 sticky left-0 bg-surface">
              평소 색
            </th>
            {divisions.map((d) => {
              const g = gradeMap[d.solve_grade]
              const color = g?.color_hex ?? "#6B7280"
              return (
                <th
                  key={d.id}
                  className="text-center text-[10px] font-black px-2 py-2.5 whitespace-nowrap"
                >
                  <div className="inline-flex flex-col items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: color }}
                    />
                    <span style={{ color }}>{d.label}</span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => {
            const set = recMap.get(grade.id) ?? new Set<string>()
            return (
              <tr key={grade.id} className="border-b border-line last:border-b-0">
                <td className="px-3 py-2 sticky left-0 bg-surface">
                  <div className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: grade.color_hex }}
                    />
                    <span className="text-xs font-black">{grade.label}</span>
                  </div>
                </td>
                {divisions.map((d) => {
                  const checked = set.has(d.id)
                  const dGrade = gradeMap[d.solve_grade]
                  const color = dGrade?.color_hex ?? "#6B7280"
                  return (
                    <td key={d.id} className="text-center px-1 py-1">
                      <button
                        type="button"
                        onClick={() => onToggle(grade.id, d.id)}
                        disabled={disabled}
                        className="w-9 h-9 rounded-lg border-2 transition mx-auto flex items-center justify-center"
                        style={
                          checked
                            ? {
                                background: color,
                                borderColor: color,
                                color: "#fff",
                              }
                            : {
                                background: "#fff",
                                borderColor: "#E7E4DD",
                                color: "#A1A1AA",
                              }
                        }
                        title={checked ? "추천 해제" : "추천 추가"}
                      >
                        <span className="text-base font-black">
                          {checked ? "✓" : ""}
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FlowStep({
  n,
  title,
  desc,
  tone,
  small = false,
}: {
  n: string
  title: string
  desc: string
  tone: "grade" | "division" | "group" | "recommend"
  small?: boolean
}) {
  const colorMap: Record<string, { bg: string; fg: string; chip: string }> = {
    grade: { bg: "#FEF2F2", fg: "#DC2626", chip: "#DC2626" },
    division: { bg: "#EFF6FF", fg: "#2563EB", chip: "#2563EB" },
    group: { bg: "#F0FDF4", fg: "#16A34A", chip: "#16A34A" },
    recommend: { bg: "#FAF5FF", fg: "#9333EA", chip: "#9333EA" },
  }
  const c = colorMap[tone]
  // n이 한글("추천")이면 동그라미 대신 알약형으로 — 글자가 잘리지 않도록.
  const badgeIsLabel = n.length > 1
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: c.bg }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center font-black text-white shrink-0 ${
            badgeIsLabel
              ? "h-5 px-2 rounded-full text-[10px]"
              : "w-5 h-5 rounded-full text-[10px]"
          }`}
          style={{ background: c.chip }}
        >
          {n}
        </span>
        <span className="font-black text-sm" style={{ color: c.fg }}>
          {title}
        </span>
      </div>
      <div
        className={`text-[11px] text-ink-700 font-bold mt-0.5 ${
          small ? "" : "ml-7"
        }`}
      >
        {desc}
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-ink-300 text-base font-black sm:rotate-0 rotate-90">
      →
    </div>
  )
}

function SignupPreview({
  grades,
  divisions,
  groups,
  recMap,
  gradeMap,
  groupMap,
}: {
  grades: Grade[]
  divisions: Division[]
  groups: RankingGroup[]
  recMap: Map<string, Set<string>>
  gradeMap: Record<string, Grade>
  groupMap: Record<string, RankingGroup>
}) {
  const [selectedGradeId, setPreviewGradeId] = useState<string>(
    grades[0]?.id ?? "",
  )

  if (grades.length === 0 || divisions.length === 0) {
    return (
      <div className="bg-mute/40 border border-dashed border-line rounded-2xl p-4 mb-4 text-center text-xs text-ink-500">
        색과 부를 등록하면 여기에 신청 화면 미리보기가 표시됩니다.
      </div>
    )
  }

  // grades가 변하며 selectedGradeId가 stale해질 수 있어 render에서 정규화.
  const previewGradeId = grades.some((g) => g.id === selectedGradeId)
    ? selectedGradeId
    : grades[0].id
  const previewGrade = gradeMap[previewGradeId]
  const recommendedSet = recMap.get(previewGradeId) ?? new Set<string>()
  const activeDivisions = divisions.filter((d) => d.active)

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 mb-4 shadow-soft">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div>
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-0.5">
            신청 화면 미리보기
          </div>
          <div className="text-xs text-ink-700">
            평소 색을 바꿔보면 추천이 어떻게 적용되는지 보여요
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {grades.map((g) => {
            const active = g.id === previewGradeId
            const bg = softBg(g.color_hex)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setPreviewGradeId(g.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition"
                style={
                  active
                    ? {
                        background: g.color_hex,
                        borderColor: g.color_hex,
                        color: "#fff",
                      }
                    : {
                        background: bg,
                        borderColor: "transparent",
                        color: g.color_hex,
                      }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? "#fff" : g.color_hex }}
                />
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-mute/40 rounded-xl p-3 sm:p-4">
        <div className="text-xs text-ink-700 mb-2">
          평소{" "}
          {previewGrade && (
            <span
              className="font-black px-1.5 py-0.5 rounded"
              style={{
                background: previewGrade.color_hex,
                color: "#fff",
              }}
            >
              {previewGrade.label}
            </span>
          )}
          {" "}을(를) 푸는 사용자에게 보일 부 선택지:
        </div>
        {activeDivisions.length === 0 ? (
          <div className="text-xs text-ink-500 italic">활성 부가 없어요</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeDivisions.map((d) => {
              const dGrade = gradeMap[d.solve_grade]
              const color = dGrade?.color_hex ?? "#6B7280"
              const isRec = recommendedSet.has(d.id)
              const group = d.ranking_group_id
                ? groupMap[d.ranking_group_id]
                : null
              return (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface"
                  style={{
                    color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  {d.label}
                  {group && (
                    <span className="text-[9px] text-ink-500 font-bold">
                      · {group.name}
                    </span>
                  )}
                  {isRec && (
                    <span className="text-[9px] font-black bg-accent text-white px-1 py-0.5 rounded">
                      추천
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        )}
        {recommendedSet.size === 0 && activeDivisions.length > 0 && (
          <div className="mt-2 text-[10px] text-ink-500">
            평소 {previewGrade?.label}에 대한 추천 부가 없어요. 모든 부 직접
            선택은 가능합니다.
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-line text-[10px] text-ink-500 leading-relaxed">
          {groups.length === 0 ? (
            <>랭킹 그룹이 없어요. 한 그룹에 부를 묶으면 합산 랭킹이 만들어집니다.</>
          ) : (
            <>
              랭킹은{" "}
              {groups
                .map((g) => {
                  const inG = divisions.filter(
                    (d) => d.ranking_group_id === g.id && d.active,
                  )
                  return `${g.name}(${inG.map((d) => d.label).join(",") || "비어있음"})`
                })
                .join(" / ")}{" "}
              로 매겨집니다.
            </>
          )}
        </div>
      </div>
    </div>
  )
}
