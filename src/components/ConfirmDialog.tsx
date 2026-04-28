"use client"

import { Modal } from "./Modal"

type Props = {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "danger"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  const isDanger = variant === "danger"
  return (
    <Modal open={open} onClose={onCancel} ariaLabel={title} size="sm">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg font-black ${
            isDanger ? "bg-accent-soft text-accent" : "bg-mute text-ink-700"
          }`}
          aria-hidden
        >
          {isDanger ? "!" : "?"}
        </div>
        <div className="flex-1 pt-0.5">
          <h2 className="text-base sm:text-lg font-black mb-1">{title}</h2>
          <div className="text-sm text-ink-700 leading-relaxed">{message}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-3.5 rounded-xl bg-mute text-ink-700 font-black text-sm hover:bg-line transition"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`py-3.5 rounded-xl font-black text-sm text-white shadow-pop transition ${
            isDanger
              ? "bg-accent hover:bg-accent/90"
              : "bg-ink-900 hover:bg-ink-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
