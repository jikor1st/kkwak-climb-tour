"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  value: number
  durationMs?: number
  className?: string
}

export function CountUpNumber({ value, durationMs = 900, className }: Props) {
  const [display, setDisplay] = useState(0)
  const startTsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const target = Math.max(0, Math.floor(value))
    const start = display
    if (target === start) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reduce ? 0 : durationMs

    startTsRef.current = null
    const tick = (ts: number) => {
      if (startTsRef.current == null) startTsRef.current = ts
      const elapsed = ts - startTsRef.current
      const t = duration === 0 ? 1 : Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const current = Math.round(start + (target - start) * eased)
      setDisplay(current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  return <span className={className}>{display}</span>
}
