"use client"

type Props = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  format?: (n: number) => string
  ariaLabel?: string
  disabled?: boolean
  size?: "md" | "lg"
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  format,
  ariaLabel,
  disabled = false,
  size = "md",
}: Props) {
  const display = format ? format(value) : String(value)
  const dec = () => {
    if (disabled) return
    const next = Math.max(min, value - step)
    if (next !== value) onChange(next)
  }
  const inc = () => {
    if (disabled) return
    const next = Math.min(max, value + step)
    if (next !== value) onChange(next)
  }
  const minusDisabled = disabled || value <= min
  const plusDisabled = disabled || value >= max

  const btnSize = size === "lg" ? "w-12 h-12 text-xl" : "w-10 h-10 text-base"
  const valueSize = size === "lg" ? "text-2xl min-w-[3ch]" : "text-lg min-w-[2.5ch]"

  return (
    <div
      className={`inline-flex items-center gap-1 bg-mute rounded-2xl p-1 ${
        disabled ? "opacity-50" : ""
      }`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={dec}
        disabled={minusDisabled}
        className={`${btnSize} rounded-xl bg-surface border border-line shadow-soft font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-accent transition active:scale-95`}
        aria-label="감소"
      >
        −
      </button>
      <div
        className={`${valueSize} font-black num text-center px-1 select-none`}
      >
        {display}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={plusDisabled}
        className={`${btnSize} rounded-xl bg-accent text-white shadow-pop font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition active:scale-95`}
        aria-label="증가"
      >
        +
      </button>
    </div>
  )
}
