"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { isIOS as detectIOS } from "@/lib/utils/platform"

// Chrome/Android에서 firing되는 PWA 설치 prompt 이벤트.
// 표준 타입은 아직 lib.dom에 없어 직접 정의.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_DAYS = 7
// 사용자가 첫 인터랙션을 시작할 시간을 주고 띄움 (페이지 진입 후 N ms 뒤)
const SHOW_AFTER_MS = 6000

// 인증/온보딩/신청처럼 사용자가 핵심 작업에 집중해야 하는 경로에서는 노출 안 함.
const HIDE_PATH_PREFIXES = ["/login", "/onboarding", "/post-login", "/signup"]

export function InstallPrompt() {
  const pathname = usePathname() ?? ""
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<"chrome" | "ios" | null>(() =>
    typeof window !== "undefined" && detectIOS() ? "ios" : null,
  )
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // 이미 설치됨 — Android/Chrome standalone 또는 iOS standalone
    const standaloneMQ = window.matchMedia("(display-mode: standalone)").matches
    const iosStandalone =
      (window as unknown as { standalone?: boolean }).standalone === true
    if (standaloneMQ || iosStandalone) return

    // 7일 쿨다운
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      if (raw === "installed") return
      const at = Number(raw)
      if (at && Date.now() - at < DISMISS_DAYS * 86_400_000) return
    } catch {
      // localStorage 비활성 환경이면 그냥 노출
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    if (detectIOS()) {
      timer = setTimeout(() => setShow(true), SHOW_AFTER_MS)
      return () => {
        if (timer) clearTimeout(timer)
      }
    }

    const adopt = (e: BeforeInstallPromptEvent) => {
      setDeferredPrompt(e)
      setPlatform("chrome")
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setShow(true), SHOW_AFTER_MS)
    }

    // 마운트 전에 이미 발화돼 layout의 inline 스크립트가 stash 해둔 이벤트가 있으면 즉시 사용.
    type PWAStashWindow = Window & {
      __deferredInstallPrompt?: BeforeInstallPromptEvent | null
    }
    const stashed = (window as PWAStashWindow).__deferredInstallPrompt
    if (stashed) adopt(stashed)

    const onBefore = (e: Event) => {
      e.preventDefault()
      adopt(e as BeforeInstallPromptEvent)
    }
    const onStashReady = () => {
      const s = (window as PWAStashWindow).__deferredInstallPrompt
      if (s) adopt(s)
    }

    const onInstalled = () => {
      try {
        localStorage.setItem(DISMISS_KEY, "installed")
      } catch {
        /* noop */
      }
      setShow(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", onBefore)
    window.addEventListener("__pwaPromptReady", onStashReady)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore)
      window.removeEventListener("__pwaPromptReady", onStashReady)
      window.removeEventListener("appinstalled", onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  // 인증/온보딩/신청 경로에선 항상 숨김
  const shouldHide = HIDE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )
  if (shouldHide) return null

  if (!show) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* noop */
    }
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome !== "accepted") {
        dismiss()
      } else {
        setShow(false)
      }
    } catch {
      dismiss()
    } finally {
      setDeferredPrompt(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      className="fixed left-3 right-3 z-[60] install-prompt-enter pointer-events-none"
      style={{
        // BottomNav (max-md, ~64px + safe-bottom) 위에 떠야 함.
        // BottomNav가 없는 페이지에서도 자연스럽게 보이도록 safe-bottom + 1.25rem 고정.
        bottom:
          "calc(max(env(safe-area-inset-bottom, 0px), 0.875rem) + 5.25rem)",
      }}
    >
      <div className="max-w-md mx-auto bg-ink-900 text-white rounded-2xl shadow-pop p-3.5 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-pop"
            aria-hidden
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5V21H3z" />
              <path d="M9 21v-7h6v7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black mb-0.5">
              앱처럼 빠르게 쓰는 법
            </div>
            {platform === "ios" ? (
              <p className="text-[11.5px] text-white/70 leading-relaxed">
                Safari 하단{" "}
                <span
                  aria-hidden
                  className="inline-block translate-y-[1px] mx-0.5"
                >
                  ⎋
                </span>{" "}
                <strong className="text-white">공유</strong> →{" "}
                <strong className="text-white">홈 화면에 추가</strong>를 누르면
                앱처럼 한 번에 열려요.
              </p>
            ) : (
              <p className="text-[11.5px] text-white/70 leading-relaxed">
                홈 화면에 추가하면 주소창 없이 앱처럼 열려요. 대회 당일 빠르게
                기록할 수 있어요.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="설치 안내 닫기"
            className="shrink-0 -mt-1 -mr-1 w-7 h-7 rounded-full text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
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
        {platform === "chrome" && deferredPrompt && (
          <button
            type="button"
            onClick={install}
            className="mt-3 w-full py-2.5 rounded-xl bg-accent text-white text-xs font-black hover:bg-accent/90 transition shadow-pop"
          >
            홈 화면에 추가하기
          </button>
        )}
      </div>
    </div>
  )
}
