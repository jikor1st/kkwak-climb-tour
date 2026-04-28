"use client"

import { useEffect } from "react"

type Props = {
  open: boolean
  onClose: () => void
  ariaLabel?: string
  children: React.ReactNode
  size?: "sm" | "md"
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
  size = "md",
  closeOnBackdrop = true,
}: Props) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const widthCls = size === "sm" ? "sm:max-w-sm" : "sm:max-w-md"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-5"
      onClick={() => closeOnBackdrop && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widthCls} bg-surface rounded-t-3xl sm:rounded-3xl shadow-card border-t sm:border border-line p-5 sm:p-6 dialog-enter`}
      >
        {children}
      </div>
    </div>
  )
}
