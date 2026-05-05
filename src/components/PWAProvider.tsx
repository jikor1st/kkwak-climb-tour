"use client"

import { useEffect, useState } from "react"

// 페이지 어디든 마운트되어 있으면 자동으로 SW를 등록·갱신·반영하는 클라이언트
// 사이드 부트스트랩 컴포넌트.
//
// 동작 흐름
// 1) 마운트 시 /sw.js 등록 (Cache-Control: no-store 이라 항상 신선한 SW 본문)
// 2) 매번 visibilitychange / focus 이벤트마다 reg.update() — 딴 데 다녀온
//    사이에 새 빌드가 떴는지 확인
// 3) 새 SW가 'installed' 상태로 waiting하면 사용자에게 "새 버전 있어요" 토스트
// 4) 토스트 버튼 누르면 SW에 SKIP_WAITING 메시지 → 새 SW가 활성화되고
//    controllerchange 이벤트가 발생 → location.reload()
//
// 자동 reload 안 함 (사용자가 입력 중이면 데이터 잃을 수 있음). 단, 사용자가 묻지
// 않고 reload하길 원하면 controllerchange 핸들러에서 자동 reload 가능.
export function PWAProvider() {
  const [updateReady, setUpdateReady] = useState(false)
  const [waitingWorker, setWaitingWorker] =
    useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    // 개발 환경에서는 SW 등록을 건너뛴다 — Next dev의 HMR과 충돌 가능
    if (process.env.NODE_ENV !== "production") return

    let cancelled = false
    let registration: ServiceWorkerRegistration | null = null

    const trackWaiting = (sw: ServiceWorker) => {
      if (cancelled) return
      setWaitingWorker(sw)
      setUpdateReady(true)
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return
        registration = reg

        // 이미 waiting인 SW가 있으면 즉시 토스트
        if (reg.waiting && navigator.serviceWorker.controller) {
          trackWaiting(reg.waiting)
        }

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // 첫 설치가 아니라 업데이트 — 사용자에게 알림
              trackWaiting(installing)
            }
          })
        })
      })
      .catch(() => {
        // 등록 실패해도 앱 사용에는 지장 없음
      })

    // 사용자가 탭으로 돌아올 때마다 새 빌드 체크
    const checkUpdate = () => {
      if (document.visibilityState === "visible" && registration) {
        registration.update().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", checkUpdate)
    window.addEventListener("focus", checkUpdate)

    // 새 SW가 활성화되면 controllerchange 발생 → 페이지 reload
    let refreshing = false
    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    )

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", checkUpdate)
      window.removeEventListener("focus", checkUpdate)
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      )
    }
  }, [])

  if (!updateReady) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-3 right-3 z-[100]"
      style={{
        // BottomNav 위에 안정적으로 띄우기 — InstallPrompt 와 동일한 간격 규칙.
        bottom:
          "calc(max(env(safe-area-inset-bottom, 0px), 0.875rem) + 5.25rem)",
      }}
    >
      <div className="max-w-md mx-auto flex items-center gap-3 bg-ink-900 text-white rounded-2xl pl-3.5 pr-2 py-2 shadow-pop backdrop-blur-md">
        <span className="relative inline-flex w-2 h-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-accent live-dot-ring" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-accent live-dot" />
        </span>
        <div className="flex-1 min-w-0 text-xs font-bold leading-tight">
          <div className="truncate">새 버전이 있어요</div>
          <div className="truncate text-[11px] font-bold text-white/60">
            지금 바로 적용해보세요
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (waitingWorker) waitingWorker.postMessage({ type: "SKIP_WAITING" })
            else window.location.reload()
          }}
          className="shrink-0 px-3 py-2 rounded-xl bg-accent text-white text-xs font-black shadow-pop hover:bg-accent/90 transition whitespace-nowrap"
        >
          새로고침
        </button>
      </div>
    </div>
  )
}
