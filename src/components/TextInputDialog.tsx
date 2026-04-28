"use client"

import { useEffect, useRef, useState } from "react"
import { Modal } from "./Modal"

type Props = {
  open: boolean
  title: string
  subtitle?: string
  placeholder?: string
  initialValue?: string
  maxLength?: number
  confirmLabel?: string
  validate?: (value: string) => string | null
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function TextInputDialog({
  open,
  title,
  subtitle,
  placeholder,
  initialValue = "",
  maxLength = 60,
  confirmLabel = "확인",
  validate,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setError(null)
      // focus after mount
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open, initialValue])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError("값을 입력해주세요")
      return
    }
    if (validate) {
      const v = validate(trimmed)
      if (v) {
        setError(v)
        return
      }
    }
    onConfirm(trimmed)
  }

  return (
    <Modal open={open} onClose={onCancel} ariaLabel={title} size="sm">
      <div className="flex items-start justify-between gap-3 mb-3">
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

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3.5 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-bold transition placeholder:font-normal placeholder:text-ink-300"
      />

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className={`text-xs ${error ? "text-accent font-black" : "text-ink-500"}`}>
          {error ?? "엔터로 빠르게 입력 완료"}
        </span>
        <span className="text-[11px] text-ink-500 font-bold num">
          {value.length}/{maxLength}
        </span>
      </div>

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
          onClick={submit}
          className="py-3.5 rounded-xl bg-accent text-white font-black text-sm hover:bg-accent/90 transition shadow-pop"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
