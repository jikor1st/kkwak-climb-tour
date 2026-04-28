"use client"

import {
  DateInput,
  DateSegment,
  TimeField,
} from "react-aria-components"
import { Time } from "@internationalized/date"

type Props = {
  label: string
  value: string | null
  onChange: (next: string | null) => void
  nullable?: boolean
  defaultValue?: string
  hint?: string
  presets?: string[]
}

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseTime(value: string | null): Time | null {
  if (!value) return null
  const m = /^(\d{2}):(\d{2})/.exec(value)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  return new Time(h, min)
}

function timeToString(t: Time): string {
  return `${pad2(t.hour)}:${pad2(t.minute)}`
}

function adjustMinutes(value: string | null, deltaMin: number, fallback: string): string {
  const t = parseTime(value) ?? parseTime(fallback) ?? new Time(9, 0)
  const total = t.hour * 60 + t.minute + deltaMin
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`
}

export function TimePickerInput({
  label,
  value,
  onChange,
  nullable = false,
  defaultValue = "09:00",
  hint,
  presets,
}: Props) {
  const time = parseTime(value)
  const isSet = time !== null

  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-ink-700">{label}</span>
        {nullable && (
          <button
            type="button"
            onClick={() => {
              if (isSet) onChange(null)
              else onChange(defaultValue)
            }}
            className={`text-[11px] font-black px-2.5 py-1 rounded-full transition ${
              isSet
                ? "bg-mute text-ink-500 hover:bg-line"
                : "bg-accent-soft text-accent hover:bg-accent/10"
            }`}
          >
            {isSet ? "비우기" : "설정 안 됨"}
          </button>
        )}
      </div>

      <TimeField
        aria-label={label}
        value={time}
        hourCycle={24}
        onChange={(next) => {
          if (next) onChange(timeToString(next as Time))
        }}
        isDisabled={!isSet}
      >
        <DateInput
          className={`flex items-center justify-center gap-1 px-4 py-3 rounded-xl border-2 transition num text-3xl font-black tracking-tight ${
            isSet
              ? "border-line bg-mute hover:border-line-strong focus-within:border-accent focus-within:bg-surface"
              : "border-line bg-mute opacity-50 cursor-not-allowed"
          }`}
        >
          {(segment) => {
            const isLiteral = segment.type === "literal"
            return (
              <DateSegment
                segment={segment}
                className={`outline-none px-1 rounded-md tabular-nums caret-accent text-ink-900 data-[focused]:bg-accent data-[focused]:text-white data-[placeholder]:text-ink-300 ${
                  isLiteral ? "text-ink-300 px-0" : "min-w-[1.5ch]"
                }`}
              />
            )
          }}
        </DateInput>
      </TimeField>

      {isSet && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => onChange(adjustMinutes(value, -5, defaultValue))}
            className="px-3 py-1.5 rounded-lg bg-mute hover:bg-line text-xs font-black transition num"
            aria-label="5분 감소"
          >
            − 5분
          </button>
          <button
            type="button"
            onClick={() => onChange(adjustMinutes(value, -30, defaultValue))}
            className="px-3 py-1.5 rounded-lg bg-mute hover:bg-line text-xs font-black transition num"
            aria-label="30분 감소"
          >
            − 30분
          </button>
          <button
            type="button"
            onClick={() => onChange(adjustMinutes(value, 30, defaultValue))}
            className="px-3 py-1.5 rounded-lg bg-mute hover:bg-line text-xs font-black transition num"
            aria-label="30분 증가"
          >
            + 30분
          </button>
          <button
            type="button"
            onClick={() => onChange(adjustMinutes(value, 5, defaultValue))}
            className="px-3 py-1.5 rounded-lg bg-mute hover:bg-line text-xs font-black transition num"
            aria-label="5분 증가"
          >
            + 5분
          </button>
        </div>
      )}

      {isSet && presets && presets.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1.5">
            빠른 선택
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = value === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-black num transition ${
                    active
                      ? "bg-accent text-white shadow-pop"
                      : "bg-mute text-ink-700 hover:bg-line"
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hint && (
        <p className="text-[11px] text-ink-500 mt-3 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
