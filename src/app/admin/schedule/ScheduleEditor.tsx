"use client"

import { useMemo, useRef, useState } from "react"
import {
  buildTimeline,
  type ScheduleBreak,
  type ScheduleSettings,
} from "@/lib/contest/schedule"
import { TimePickerInput } from "@/components/TimePickerInput"
import { MinutesInput } from "@/components/MinutesInput"
import { DateField } from "@/components/DateField"
import { TextInputDialog } from "@/components/TextInputDialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  DndContext,
  PointerSensor,
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
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Settings = ScheduleSettings

type Gym = {
  id: string
  name: string
  display_order: number
  duration_minutes: number
}

type SaveState = "idle" | "saving" | "saved" | "error"

type StopItem =
  | { type: "gym"; id: string; gym: Gym }
  | { type: "break"; id: string; break: ScheduleBreak }

const BREAK_PRESETS = [
  { name: "점심", minutes: 60 },
  { name: "이동", minutes: 15 },
  { name: "휴식", minutes: 10 },
]

export function ScheduleEditor({
  settings: initialSettings,
  gyms: initialGyms,
  breaks: initialBreaks,
}: {
  settings: Settings
  gyms: Gym[]
  breaks: ScheduleBreak[]
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [gyms, setGyms] = useState<Gym[]>(initialGyms)
  const [breaks, setBreaks] = useState<ScheduleBreak[]>(initialBreaks)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveError, setSaveError] = useState("")
  const [addingBreakAfter, setAddingBreakAfter] = useState<string | null | "__none__">("__none__")
  const [renamingBreak, setRenamingBreak] = useState<ScheduleBreak | null>(null)
  const [deleteBreakTarget, setDeleteBreakTarget] = useState<ScheduleBreak | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orderedStops: StopItem[] = useMemo(() => {
    const sortedGyms = [...gyms].sort((a, b) => a.display_order - b.display_order)
    const breaksByAfter = new Map<string | null, ScheduleBreak[]>()
    for (const b of breaks) {
      const k = b.after_gym_id ?? null
      const list = breaksByAfter.get(k) ?? []
      list.push(b)
      breaksByAfter.set(k, list)
    }
    for (const list of breaksByAfter.values()) {
      list.sort((a, b) => a.display_order - b.display_order)
    }
    const out: StopItem[] = []
    for (const b of breaksByAfter.get(null) ?? []) {
      out.push({ type: "break", id: `b:${b.id}`, break: b })
    }
    for (const g of sortedGyms) {
      out.push({ type: "gym", id: `g:${g.id}`, gym: g })
      for (const b of breaksByAfter.get(g.id) ?? []) {
        out.push({ type: "break", id: `b:${b.id}`, break: b })
      }
    }
    return out
  }, [gyms, breaks])

  const timelineGyms = orderedStops
    .filter((s): s is Extract<StopItem, { type: "gym" }> => s.type === "gym")
    .map((s, i) => ({ ...s.gym, display_order: i + 1 }))
  const timeline = useMemo(
    () => buildTimeline(settings, timelineGyms, breaks),
    [settings, timelineGyms, breaks],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function flagSaving() {
    setSaveState("saving")
  }
  function flagDone(ok: boolean, err?: string) {
    if (ok) {
      setSaveState("saved")
      setSaveError("")
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500)
    } else {
      setSaveState("error")
      setSaveError(err ?? "저장 실패")
    }
  }

  function scheduleSettingsSave(patch: Partial<Settings>) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flagSaving()
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: patch }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error ?? "저장 실패")
        }
        flagDone(true)
      } catch (e) {
        flagDone(false, e instanceof Error ? e.message : undefined)
      }
    }, 500)
  }

  function updateSettings(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
    scheduleSettingsSave(patch)
  }

  async function updateGymDuration(gymId: string, minutes: number) {
    setGyms((prev) =>
      prev.map((g) =>
        g.id === gymId ? { ...g, duration_minutes: minutes } : g,
      ),
    )
    if (debounceRef.current) clearTimeout(debounceRef.current)
    flagSaving()
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gym_durations: [{ gym_id: gymId, duration_minutes: minutes }],
          }),
        })
        if (!res.ok) throw new Error("저장 실패")
        flagDone(true)
      } catch (e) {
        flagDone(false, e instanceof Error ? e.message : undefined)
      }
    }, 500)
  }

  async function persistReorder(nextStops: StopItem[]) {
    flagSaving()
    try {
      const res = await fetch("/api/admin/schedule/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stops: nextStops.map((s) =>
            s.type === "gym"
              ? { type: "gym", id: s.gym.id }
              : { type: "break", id: s.break.id },
          ),
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "저장 실패")
      }
      flagDone(true)
    } catch (e) {
      flagDone(false, e instanceof Error ? e.message : undefined)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedStops.findIndex((s) => s.id === active.id)
    const newIndex = orderedStops.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(orderedStops, oldIndex, newIndex)

    // Reflect optimistic state
    let gymOrder = 0
    let lastGymId: string | null = null
    const breakOrderByAfter = new Map<string | null, number>()
    const newGyms: Gym[] = []
    const newBreaks: ScheduleBreak[] = []
    for (const s of next) {
      if (s.type === "gym") {
        gymOrder++
        newGyms.push({ ...s.gym, display_order: gymOrder })
        lastGymId = s.gym.id
      } else {
        const order = breakOrderByAfter.get(lastGymId) ?? 0
        breakOrderByAfter.set(lastGymId, order + 1)
        newBreaks.push({
          ...s.break,
          after_gym_id: lastGymId,
          display_order: order,
        })
      }
    }
    setGyms(newGyms)
    setBreaks(newBreaks)
    persistReorder(next)
  }

  async function addBreak(name: string, minutes: number, after_gym_id: string | null) {
    flagSaving()
    try {
      const res = await fetch("/api/admin/schedule-breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          duration_minutes: minutes,
          after_gym_id,
          display_order: 999, // 끝에 붙임 (reorder가 정리)
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "생성 실패")
      setBreaks((bs) => [...bs, data.break])
      flagDone(true)
    } catch (e) {
      flagDone(false, e instanceof Error ? e.message : undefined)
    }
  }

  async function patchBreak(id: string, patch: Partial<ScheduleBreak>) {
    setBreaks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    flagSaving()
    try {
      const res = await fetch(`/api/admin/schedule-breaks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "저장 실패")
      }
      flagDone(true)
    } catch (e) {
      flagDone(false, e instanceof Error ? e.message : undefined)
    }
  }

  async function deleteBreak(id: string) {
    setBreaks((bs) => bs.filter((b) => b.id !== id))
    flagSaving()
    try {
      const res = await fetch(`/api/admin/schedule-breaks/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "삭제 실패")
      }
      flagDone(true)
    } catch (e) {
      flagDone(false, e instanceof Error ? e.message : undefined)
    }
  }

  // Build display rows with computed times for each stop
  const displayRows = useMemo(() => {
    const stopMap = new Map<string, { start: string; end: string; durationMinutes: number }>()
    for (const s of timeline.stops) {
      if (s.type === "gym") {
        stopMap.set(`g:${s.gymId}`, { start: s.start, end: s.end, durationMinutes: s.durationMinutes })
      } else {
        stopMap.set(`b:${s.breakId}`, { start: s.start, end: s.end, durationMinutes: s.durationMinutes })
      }
    }
    return orderedStops.map((s) => ({
      ...s,
      time: stopMap.get(s.id) ?? null,
    }))
  }, [orderedStops, timeline])

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
            ADMIN · SCHEDULE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            대회 일정
          </h1>
          <p className="text-xs text-ink-500 mt-1.5">자동 저장됩니다.</p>
        </div>
        <SaveStatus state={saveState} error={saveError} />
      </div>

      <Section title="대회 날짜">
        <DateField
          label="대회 일자"
          value={settings.contest_date}
          onChange={(v) => updateSettings({ contest_date: v })}
          hint="이 날짜가 곧 '오늘'이 되면 대시보드의 현재 위치 카드가 활성화됩니다."
        />
      </Section>

      <Section
        title="시작 시각"
        subtitle="종료 시각은 시작 + 타임라인에서 자동 계산돼요"
      >
        <TimePickerInput
          label="시작 시각"
          value={settings.start_time}
          onChange={(v) => updateSettings({ start_time: v })}
          nullable
          defaultValue="09:30"
          presets={["09:00", "09:30", "10:00", "10:30"]}
          hint={
            timeline.endLabel
              ? `자동 계산된 종료: ${timeline.endLabel}`
              : undefined
          }
        />
      </Section>

      <Section
        title="기본 체류시간"
        subtitle="아래 타임라인에서 지점별로 다른 값을 지정할 수 있어요"
      >
        <MinutesInput
          label="지점별 기본"
          value={settings.default_gym_minutes}
          onChange={(n) => updateSettings({ default_gym_minutes: n })}
          min={5}
          max={180}
          step={5}
          size="lg"
        />
      </Section>

      <Section
        title="타임라인"
        subtitle="드래그로 순서 변경 · 사이사이에 점심·이동·휴식 등을 추가하세요"
      >
        {orderedStops.length === 0 ? (
          <div className="bg-mute rounded-2xl p-5 text-sm text-ink-700 text-center">
            지점을 먼저 등록해주세요.
          </div>
        ) : (
          <DndContext
            id="schedule-stops"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedStops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-1.5">
                {/* 첫 지점 이전 break 추가 슬롯 */}
                <BreakInsertSlot
                  onClick={() => {
                    setAddingBreakAfter(null)
                  }}
                />
                {displayRows.map((row, idx) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    onUpdateGymMinutes={
                      row.type === "gym"
                        ? (n) => updateGymDuration(row.gym.id, n)
                        : undefined
                    }
                    onRenameBreak={
                      row.type === "break"
                        ? () => setRenamingBreak(row.break)
                        : undefined
                    }
                    onUpdateBreakMinutes={
                      row.type === "break"
                        ? (n) =>
                            patchBreak(row.break.id, {
                              duration_minutes: n,
                            })
                        : undefined
                    }
                    onDeleteBreak={
                      row.type === "break"
                        ? () => setDeleteBreakTarget(row.break)
                        : undefined
                    }
                    onAddBreakAfter={
                      row.type === "gym"
                        ? () => {
                            setAddingBreakAfter(row.gym.id)
                          }
                        : undefined
                    }
                    isLast={idx === displayRows.length - 1}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}

        {timeline.endLabel && (
          <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-ink-900 text-white">
            <span className="text-[10px] font-black uppercase tracking-wider w-12 shrink-0 num">
              {timeline.endLabel}
            </span>
            <div className="flex-1 font-black text-sm">종료</div>
          </div>
        )}
      </Section>

      {/* 빠른 break 프리셋 다이얼로그 */}
      {addingBreakAfter !== "__none__" && (
        <BreakPresetDialog
          open
          afterGymId={addingBreakAfter as string | null}
          onConfirm={(name, minutes) => {
            const after = addingBreakAfter
            setAddingBreakAfter("__none__")
            addBreak(name, minutes, after === "__none__" ? null : (after as string | null))
          }}
          onCancel={() => setAddingBreakAfter("__none__")}
        />
      )}

      <TextInputDialog
        open={renamingBreak !== null}
        title="이름 변경"
        initialValue={renamingBreak?.name ?? ""}
        confirmLabel="저장"
        onConfirm={(name) => {
          const t = renamingBreak
          setRenamingBreak(null)
          if (t) patchBreak(t.id, { name })
        }}
        onCancel={() => setRenamingBreak(null)}
      />

      <ConfirmDialog
        open={deleteBreakTarget !== null}
        title="이 시간 블록을 삭제할까요?"
        variant="danger"
        confirmLabel="삭제"
        message={
          deleteBreakTarget ? (
            <>
              <strong className="text-ink-900">{deleteBreakTarget.name}</strong>{" "}
              {deleteBreakTarget.duration_minutes}분 블록을 삭제합니다.
            </>
          ) : null
        }
        onConfirm={() => {
          const t = deleteBreakTarget
          setDeleteBreakTarget(null)
          if (t) deleteBreak(t.id)
        }}
        onCancel={() => setDeleteBreakTarget(null)}
      />

    </div>
  )
}

function BreakInsertSlot({ onClick }: { onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full py-2 rounded-xl border-2 border-dashed border-line hover:border-accent text-ink-500 hover:text-accent text-[11px] font-black transition flex items-center justify-center gap-1"
      >
        + 첫 지점 이전에 시간 추가
      </button>
    </li>
  )
}

function SortableRow({
  row,
  onUpdateGymMinutes,
  onRenameBreak,
  onUpdateBreakMinutes,
  onDeleteBreak,
  onAddBreakAfter,
}: {
  row: StopItem & { time: { start: string; end: string; durationMinutes: number } | null }
  onUpdateGymMinutes?: (minutes: number) => void
  onRenameBreak?: () => void
  onUpdateBreakMinutes?: (minutes: number) => void
  onDeleteBreak?: () => void
  onAddBreakAfter?: () => void
  isLast?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (row.type === "gym") {
    return (
      <>
        <li ref={setNodeRef} style={style}>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-line shadow-soft">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="w-7 h-9 rounded-md text-ink-300 hover:text-ink-700 hover:bg-mute transition flex items-center justify-center cursor-grab active:cursor-grabbing"
              aria-label="순서 변경"
            >
              ⋮⋮
            </button>
            <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider w-12 shrink-0 num">
              {row.time?.start ?? "--:--"}
            </span>
            <div className="flex-1 font-black text-sm truncate">{row.gym.name}</div>
            <DurationStepper
              value={row.gym.duration_minutes}
              onChange={(n) => onUpdateGymMinutes?.(n)}
            />
          </div>
        </li>
        {onAddBreakAfter && (
          <li>
            <button
              type="button"
              onClick={onAddBreakAfter}
              className="w-full py-2 rounded-xl border-2 border-dashed border-line hover:border-accent text-ink-500 hover:text-accent text-[11px] font-black transition flex items-center justify-center gap-1"
            >
              + 다음에 시간 추가 (점심·이동·휴식 등)
            </button>
          </li>
        )}
      </>
    )
  }

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-soft border border-accent/30">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="w-7 h-9 rounded-md text-accent/60 hover:text-accent hover:bg-white/40 transition flex items-center justify-center cursor-grab active:cursor-grabbing"
          aria-label="순서 변경"
        >
          ⋮⋮
        </button>
        <span className="text-[10px] font-black text-accent uppercase tracking-wider w-12 shrink-0 num">
          {row.time?.start ?? "--:--"}
        </span>
        <button
          type="button"
          onClick={onRenameBreak}
          className="flex-1 text-left font-black text-sm truncate hover:underline"
          title="이름 변경"
        >
          {row.break.name}
        </button>
        <DurationStepper
          value={row.break.duration_minutes}
          onChange={(n) => onUpdateBreakMinutes?.(n)}
          accent
        />
        <button
          type="button"
          onClick={onDeleteBreak}
          className="w-7 h-7 rounded-md text-accent/60 hover:text-accent hover:bg-white/40 flex items-center justify-center transition"
          aria-label="삭제"
        >
          ✕
        </button>
      </div>
    </li>
  )
}

function DurationStepper({
  value,
  onChange,
  accent = false,
}: {
  value: number
  onChange: (n: number) => void
  accent?: boolean
}) {
  const dec = () => onChange(Math.max(0, value - 5))
  const inc = () => onChange(Math.min(180, value + 5))
  const cls = accent
    ? "bg-white/40 hover:bg-white text-accent"
    : "bg-mute hover:bg-line text-ink-700"
  return (
    <div className={`flex items-center rounded-lg ${accent ? "bg-white/30" : "bg-mute"}`}>
      <button
        type="button"
        onClick={dec}
        className={`w-7 h-7 flex items-center justify-center rounded-l-lg text-sm font-black transition ${cls}`}
        aria-label="5분 감소"
      >
        −
      </button>
      <span
        className={`px-2 text-xs font-black num min-w-[3ch] text-center ${
          accent ? "text-accent" : "text-ink-900"
        }`}
      >
        {value}분
      </span>
      <button
        type="button"
        onClick={inc}
        className={`w-7 h-7 flex items-center justify-center rounded-r-lg text-sm font-black transition ${cls}`}
        aria-label="5분 증가"
      >
        +
      </button>
    </div>
  )
}

function BreakPresetDialog({
  open,
  afterGymId: _afterGymId,
  onConfirm,
  onCancel,
}: {
  open: boolean
  afterGymId: string | null
  onConfirm: (name: string, minutes: number) => void
  onCancel: () => void
}) {
  const [customName, setCustomName] = useState("")
  const [customMinutes, setCustomMinutes] = useState(15)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-5"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl shadow-card border-t sm:border border-line p-5 sm:p-6 dialog-enter"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-black">시간 블록 추가</h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-mute hover:bg-line transition flex items-center justify-center text-ink-700"
          >
            ✕
          </button>
        </div>
        <div className="text-[11px] text-ink-500 font-bold uppercase tracking-wider mb-2">
          빠른 선택
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {BREAK_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onConfirm(p.name, p.minutes)}
              className="py-3 rounded-xl bg-mute hover:bg-line transition text-sm font-black"
            >
              {p.name}
              <div className="text-[10px] text-ink-500 num font-bold mt-0.5">
                {p.minutes}분
              </div>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-ink-500 font-bold uppercase tracking-wider mb-2">
          직접 입력
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="이름 (예: 시상 준비)"
            className="flex-1 px-3 py-2.5 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold"
          />
          <div className="flex items-center bg-mute rounded-xl">
            <button
              type="button"
              onClick={() => setCustomMinutes((m) => Math.max(0, m - 5))}
              className="w-9 h-full flex items-center justify-center text-base font-black"
            >
              −
            </button>
            <span className="px-2 text-sm font-black num min-w-[3ch] text-center">
              {customMinutes}
            </span>
            <button
              type="button"
              onClick={() => setCustomMinutes((m) => Math.min(180, m + 5))}
              className="w-9 h-full flex items-center justify-center text-base font-black"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const trimmed = customName.trim()
            if (!trimmed) return
            onConfirm(trimmed, customMinutes)
            setCustomName("")
          }}
          disabled={!customName.trim()}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-black text-sm hover:bg-accent/90 transition shadow-pop disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          추가
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface border border-line rounded-3xl p-5 sm:p-6 mb-4 shadow-soft">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-black">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-ink-500 mt-0.5">{subtitle}</div>
        )}
      </div>
      {children}
    </section>
  )
}

function SaveStatus({ state, error }: { state: SaveState; error: string }) {
  let dot = "bg-ink-300"
  let text = "변경 사항 없음"
  if (state === "saving") {
    dot = "bg-accent animate-pulse"
    text = "저장 중..."
  } else if (state === "saved") {
    dot = "bg-grade-green"
    text = "저장됨"
  } else if (state === "error") {
    dot = "bg-accent"
    text = error || "저장 실패"
  }
  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-700 font-bold pt-1 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{text}</span>
    </div>
  )
}
