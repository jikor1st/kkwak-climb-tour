"use client"

import { useEffect, useRef, useState } from "react"
import { DayPicker } from "react-day-picker"
import { ko } from "date-fns/locale"

type Props = {
  label: string
  value: string | null
  onChange: (next: string) => void
  hint?: string
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatPretty(value: string | null): string {
  const d = parseDate(value)
  if (!d) return "날짜를 선택해주세요"
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`
}

export function DateField({ label, value, onChange, hint }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = parseDate(value)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-ink-700">{label}</span>
        <span className="text-[11px] text-ink-500 font-bold">캘린더</span>
      </div>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full px-4 py-3.5 rounded-xl border bg-mute text-base font-black num text-left transition flex items-center justify-between gap-2 ${
            open ? "border-accent bg-surface" : "border-line hover:border-line-strong"
          }`}
        >
          <span className={selected ? "text-ink-900" : "text-ink-500"}>
            {formatPretty(value)}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-500 shrink-0"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-surface border border-line rounded-2xl shadow-card p-3">
            <DayPicker
              mode="single"
              locale={ko}
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={(d) => {
                if (d) {
                  onChange(toISO(d))
                  setOpen(false)
                }
              }}
              showOutsideDays
              weekStartsOn={0}
            />
          </div>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-ink-500 mt-3 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
