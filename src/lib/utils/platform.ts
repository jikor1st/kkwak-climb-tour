export function isIOS(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  if (!ua) return false
  if (!/iPad|iPhone|iPod/i.test(ua)) return false
  if (typeof window !== "undefined") {
    const w = window as unknown as { MSStream?: unknown }
    if (w.MSStream) return false
  }
  return true
}
