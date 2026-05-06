"use client"

import { useEffect, useState } from "react"
import { isIOS as detectIOS } from "@/lib/utils/platform"

// VAPID Public Key는 빌드 타임에 클라 번들에 포함되어 있어야 한다 (브라우저가 구독 시 사용).
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

type Status =
  | "loading" // 초기 진단 중
  | "unsupported" // 브라우저가 푸시 미지원
  | "ios-needs-install" // iOS Safari인데 PWA로 설치되지 않음
  | "denied" // 권한 거절됨 (브라우저에서 직접 풀어야 함)
  | "subscribed" // 이미 구독 중
  | "ready" // 권한 prompt 가능

const DISMISS_KEY = "push-enable-dismissed-at"
const DISMISS_DAYS = 7

// VAPID public key는 base64url. 브라우저 subscribe 호출엔 ArrayBuffer가 필요해 변환.
// (SharedArrayBuffer 가능성 배제하기 위해 ArrayBuffer로 직접 할당)
function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i)
  return buf
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  return (window as unknown as { standalone?: boolean }).standalone === true
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return !!at && Date.now() - at < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}

export function EnableNotifications() {
  const [status, setStatus] = useState<Status>("loading")
  const [busy, setBusy] = useState(false)
  // 쿨다운 판정은 동기적으로 가능 → 렌더 시점에 즉시 결정. effect에서 setState 안 함.
  const [hidden, setHidden] = useState<boolean>(() => isDismissed())

  useEffect(() => {
    if (typeof window === "undefined") return
    if (hidden) return

    let cancelled = false

    void (async () => {
      // iOS는 PWA 설치(standalone)된 상태에서만 푸시 가능 (16.4+).
      if (detectIOS() && !isStandalone()) {
        if (!cancelled) setStatus("ios-needs-install")
        return
      }

      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      if (!supported || !VAPID_PUBLIC) {
        if (!cancelled) setStatus("unsupported")
        return
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied")
        return
      }

      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing && Notification.permission === "granted") {
          if (!cancelled) setStatus("subscribed")
          return
        }
      } catch {
        /* SW 미등록 — ready 단계에서 문제일 수 있음. ready 케이스로 진행 */
      }

      if (!cancelled) setStatus("ready")
    })()

    return () => {
      cancelled = true
    }
  }, [hidden])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* noop */
    }
    setHidden(true)
  }

  async function enable() {
    if (busy) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        if (permission === "denied") setStatus("denied")
        return
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBuffer(VAPID_PUBLIC),
        })
      }

      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      })
      if (!res.ok) {
        // 서버 등록 실패 시 클라 구독도 정리 (zombie 방지)
        await sub.unsubscribe().catch(() => {})
        throw new Error("서버 등록 실패")
      }
      setStatus("subscribed")
    } catch (err) {
      console.error("[push enable] failed:", err)
    } finally {
      setBusy(false)
    }
  }

  if (hidden) return null
  if (status === "loading" || status === "subscribed" || status === "unsupported") {
    return null
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-soft">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center"
          aria-hidden
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black tracking-tight">
            대회 당일 알림 받기
          </div>
          <Body status={status} />
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="알림 안내 닫기"
          className="shrink-0 -mt-1 -mr-1 w-7 h-7 rounded-full text-ink-300 hover:text-ink-700 hover:bg-mute flex items-center justify-center transition"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {status === "ready" && (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="mt-3 w-full py-2.5 rounded-xl bg-accent text-white text-xs font-black hover:bg-accent/90 transition shadow-pop disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "등록 중..." : "알림 받기"}
        </button>
      )}
    </div>
  )
}

function Body({ status }: { status: Status }) {
  if (status === "ios-needs-install") {
    return (
      <p className="text-[11.5px] text-ink-700 leading-relaxed mt-0.5">
        iOS는 <strong className="text-ink-900">홈 화면에 추가</strong>해야 알림을
        받을 수 있어요. Safari 하단 공유 → 홈 화면에 추가 후, 그 앱에서 다시
        열어주세요.
      </p>
    )
  }
  if (status === "denied") {
    return (
      <p className="text-[11.5px] text-ink-700 leading-relaxed mt-0.5">
        알림이 차단돼 있어요. 브라우저 주소창 옆 자물쇠 아이콘에서{" "}
        <strong className="text-ink-900">알림 권한</strong>을 허용으로 바꿔주세요.
      </p>
    )
  }
  return (
    <p className="text-[11.5px] text-ink-700 leading-relaxed mt-0.5">
      운영진이 보내는 핫 공지를 즉시 받아볼 수 있어요.
    </p>
  )
}
