"use client"

import { useMemo, useRef, useState } from "react"
import { buildTimeline, type ScheduleSettings } from "@/lib/contest/schedule"
import { TimePickerInput } from "@/components/TimePickerInput"
import { MinutesInput } from "@/components/MinutesInput"
import { Stepper } from "@/components/Stepper"
import { DateField } from "@/components/DateField"

type Settings = ScheduleSettings

type Gym = {
  id: string
  name: string
  display_order: number
  duration_minutes: number
}

type SaveState = "idle" | "saving" | "saved" | "error"

export function ScheduleEditor({
  settings: initialSettings,
  gyms: initialGyms,
}: {
  settings: Settings
  gyms: Gym[]
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [gyms, setGyms] = useState<Gym[]>(initialGyms)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveError, setSaveError] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const timeline = useMemo(
    () => buildTimeline(settings, gyms),
    [settings, gyms],
  )

  function scheduleSave(payload: {
    settings?: Partial<Settings>
    gym_durations?: { gym_id: string; duration_minutes: number }[]
  }) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveState("saving")
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? "저장 실패")
        }
        setSaveState("saved")
        setSaveError("")
        setTimeout(() => {
          setSaveState((s) => (s === "saved" ? "idle" : s))
        }, 1500)
      } catch (e) {
        setSaveState("error")
        setSaveError(e instanceof Error ? e.message : "저장 실패")
      }
    }, 500)
  }

  function updateSettings(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
    scheduleSave({ settings: patch })
  }

  function updateGymDuration(gymId: string, minutes: number) {
    setGyms((prev) =>
      prev.map((g) =>
        g.id === gymId ? { ...g, duration_minutes: minutes } : g,
      ),
    )
    scheduleSave({
      gym_durations: [{ gym_id: gymId, duration_minutes: minutes }],
    })
  }

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

      {/* 대회 날짜 */}
      <Section title="대회 날짜" subtitle="랜딩·대시보드에 표시되는 기준 날짜">
        <DateField
          label="대회 일자"
          value={settings.contest_date}
          onChange={(v) => updateSettings({ contest_date: v })}
          hint="이 날짜가 곧 '오늘'이 되면 대시보드의 현재 위치 카드가 활성화됩니다."
        />
      </Section>

      {/* 전체 시간 */}
      <Section title="전체 시간">
        <div className="grid sm:grid-cols-2 gap-3">
          <TimePickerInput
            label="시작 시각"
            value={settings.start_time}
            onChange={(v) => updateSettings({ start_time: v })}
            nullable
            defaultValue="09:30"
            presets={["09:00", "09:30", "10:00", "10:30"]}
          />
          <TimePickerInput
            label="종료 시각 (안내용)"
            value={settings.end_time}
            onChange={(v) => updateSettings({ end_time: v })}
            nullable
            defaultValue="16:50"
            presets={["16:00", "16:30", "17:00", "17:30", "18:00"]}
            hint={
              timeline.computedEndLabel
                ? `자동 계산: ${timeline.computedEndLabel}`
                : undefined
            }
          />
        </div>
      </Section>

      {/* 점심시간 */}
      <Section title="점심시간">
        <div className="grid sm:grid-cols-2 gap-3">
          <TimePickerInput
            label="점심 시작"
            value={settings.lunch_start_time}
            onChange={(v) => updateSettings({ lunch_start_time: v })}
            nullable
            defaultValue="12:00"
            presets={["11:30", "12:00", "12:30", "13:00"]}
            hint="비우면 점심시간 없이 진행"
          />
          <MinutesInput
            label="점심 길이"
            value={settings.lunch_minutes}
            onChange={(n) => updateSettings({ lunch_minutes: n })}
            min={0}
            max={180}
            step={5}
            size="lg"
          />
        </div>
      </Section>

      {/* 기본 체류시간 */}
      <Section title="기본 체류시간">
        <MinutesInput
          label="지점별 기본"
          value={settings.default_gym_minutes}
          onChange={(n) => updateSettings({ default_gym_minutes: n })}
          min={5}
          max={180}
          step={5}
          size="lg"
          hint="아래에서 지점별로 다른 값을 지정할 수 있어요."
        />
      </Section>

      {/* 지점별 체류시간 */}
      <Section title="지점별 체류시간">
        <div className="space-y-2">
          {gyms.map((gym, i) => (
            <div
              key={gym.id}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-line"
            >
              <div className="w-8 h-8 rounded-lg bg-mute flex items-center justify-center text-xs font-black text-ink-700 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 font-black">{gym.name}</div>
              <Stepper
                value={gym.duration_minutes}
                onChange={(n) => updateGymDuration(gym.id, n)}
                min={5}
                max={180}
                step={5}
                ariaLabel={`${gym.name} 체류시간`}
                format={(n) => `${n}`}
              />
              <span className="text-xs text-ink-500 font-bold">분</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 미리보기 */}
      <Section title="미리보기" subtitle="입력값을 기반으로 자동 계산됩니다">
        {!timeline.hasStartTime ? (
          <div className="bg-mute rounded-2xl p-5 text-sm text-ink-700 text-center">
            시작 시각을 먼저 입력하면 일정이 계산돼요.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {timeline.stops.map((stop, idx) =>
              stop.type === "lunch" ? (
                <li
                  key={`lunch-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-accent-soft border border-accent/20"
                >
                  <span className="text-[10px] font-black text-accent uppercase tracking-wider w-12 shrink-0 num">
                    {stop.start}
                  </span>
                  <div className="flex-1 font-black text-sm">점심</div>
                  <div className="text-xs text-ink-700 num font-bold">
                    {stop.durationMinutes}분
                  </div>
                </li>
              ) : (
                <li
                  key={stop.gymId}
                  className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface"
                >
                  <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider w-12 shrink-0 num">
                    {stop.start}
                  </span>
                  <div className="flex-1 font-black text-sm">{stop.name}</div>
                  <div className="text-xs text-ink-500 num font-bold">
                    {stop.durationMinutes}분
                  </div>
                </li>
              ),
            )}
            {timeline.computedEndLabel && (
              <li className="flex items-center gap-3 p-3 rounded-xl bg-ink-900 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider w-12 shrink-0 num">
                  {timeline.computedEndLabel}
                </span>
                <div className="flex-1 font-black text-sm">종료</div>
              </li>
            )}
          </ol>
        )}
      </Section>
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
