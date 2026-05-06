"use client"

import { useEffect, useState } from "react"
import { Modal } from "./Modal"

type Props = {
  open: boolean
  title: string
  subtitle?: string
  initialValue: number
  total: number
  onConfirm: (value: number) => void
  onCancel: () => void
}

export function NumberInputDialog(props: Props) {
  if (!props.open) return null
  return <Body {...props} />
}

function Body({
  title,
  subtitle,
  initialValue,
  total,
  onConfirm,
  onCancel,
}: Omit<Props, "open">) {
  const [value, setValue] = useState(() =>
    Math.max(0, Math.min(initialValue, total)),
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onConfirm(value)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setValue((v) => Math.min(total, v + 1))
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setValue((v) => Math.max(0, v - 1))
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        setValue((v) => {
          const candidate = v * 10 + Number(e.key)
          if (candidate > total) return Number(e.key) <= total ? Number(e.key) : v
          return candidate
        })
      } else if (e.key === "Backspace") {
        e.preventDefault()
        setValue((v) => Math.floor(v / 10))
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [value, total, onConfirm])

  const ratio = total > 0 ? Math.round((value / total) * 100) : 0
  const presets = total > 0
    ? [
        { label: "0", v: 0 },
        { label: "절반", v: Math.floor(total / 2) },
        { label: "전부", v: total },
      ]
    : []

  return (
    <Modal open onClose={onCancel} ariaLabel={title}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          {subtitle && (
            <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-mute hover:bg-line transition flex items-center justify-center text-ink-700"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="my-5 text-center">
        <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2">
          완등 갯수
        </div>
        <div className="flex items-baseline justify-center gap-2 num leading-none">
          <span className="text-6xl font-black text-accent">{value}</span>
          <span className="text-2xl font-black text-ink-300">/ {total}</span>
        </div>
        <div className="text-xs text-ink-500 mt-2 num font-bold">
          완등률 {ratio}%
        </div>
      </div>

      <div className="h-2 bg-mute rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${ratio}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => setValue((v) => Math.max(0, v - 1))}
          disabled={value <= 0}
          className="w-16 h-16 rounded-2xl bg-mute hover:bg-line disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-3xl font-black active:scale-95"
          aria-label="−1"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) {
              setValue(Math.max(0, Math.min(Math.floor(n), total)))
            }
          }}
          className="flex-1 text-3xl font-black num text-center bg-mute rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={0}
          max={total}
        />
        <button
          type="button"
          onClick={() => setValue((v) => Math.min(total, v + 1))}
          disabled={value >= total}
          className="w-16 h-16 rounded-2xl bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-3xl font-black text-white shadow-pop active:scale-95"
          aria-label="+1"
        >
          +
        </button>
      </div>

      {presets.length > 0 && (
        <div className="flex gap-2 mb-5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setValue(p.v)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition ${
                value === p.v
                  ? "bg-ink-900 text-white"
                  : "bg-mute text-ink-700 hover:bg-line"
              }`}
            >
              {p.label}
              <span className="ml-1.5 text-ink-300 num font-bold">{p.v}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-3.5 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onConfirm(value)}
          className="py-3.5 rounded-xl bg-accent text-white font-black text-sm hover:bg-accent/90 transition shadow-pop"
        >
          확인
        </button>
      </div>
    </Modal>
  )
}
