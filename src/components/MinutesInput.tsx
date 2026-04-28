"use client"

import { Stepper } from "./Stepper"

type Props = {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  size?: "md" | "lg"
}

export function MinutesInput({
  label,
  value,
  onChange,
  min = 0,
  max = 600,
  step = 5,
  hint,
  size = "md",
}: Props) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-ink-700">{label}</span>
        <span className="text-[11px] text-ink-500 font-bold">분 단위</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Stepper
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          ariaLabel={label}
          size={size}
        />
        <span className="text-sm font-black text-ink-700">분</span>
      </div>
      {hint && (
        <p className="text-[11px] text-ink-500 mt-3 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
