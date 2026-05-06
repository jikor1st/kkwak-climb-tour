"use client"

import { useEffect } from "react"
import { getIsKakaoTalkWebview } from "@/lib/utils/kakaotalk"
import { isIOS } from "@/lib/utils/platform"

// KakaoTalk이 인식하는 scheme — 진짜 URL을 실어서 호출하면 외부 브라우저로
// 열어준다. 인앱 브라우저는 닫지 않아 외부 launch 실패 시 계속 사용 가능.
function buildExternalSchemeUrl(target: string): string {
  if (isIOS()) {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`
  }
  // Android: intent:// URI로 Chrome을 직접 띄움
  const stripped = target.replace(/^https?:\/\//i, "")
  return `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`
}

function resolveTargetUrl(): string {
  if (typeof window === "undefined") return "/"
  const search = new URLSearchParams(window.location.search)
  const next = search.get("next") || "/"
  // path-only("/foo")만 허용해서 open redirect 방지. 다른 도메인을 받으면
  // 그냥 origin으로 fallback.
  const origin = window.location.origin
  if (!next.startsWith("/")) return origin
  return `${origin}${next}`
}

export default function InAppBrowserPage() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!getIsKakaoTalkWebview(window.navigator.userAgent)) return
    window.location.href = buildExternalSchemeUrl(resolveTargetUrl())
  }, [])

  function manualOpen() {
    window.location.href = buildExternalSchemeUrl(resolveTargetUrl())
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-surface border border-line rounded-3xl shadow-card p-7 text-center">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-3">
          꽉크루 2026
        </div>
        <h1 className="text-xl font-black tracking-tight mb-2">
          외부 브라우저로 열어주세요
        </h1>
        <p className="text-sm text-ink-700 leading-relaxed mb-5">
          카카오톡 인앱 브라우저에선 일부 기능(앱 설치 · 알림)이 막혀있어요.
          <strong className="text-ink-900"> Chrome/Safari로 열면 </strong>
          모두 정상 동작합니다.
        </p>

        <button
          type="button"
          onClick={manualOpen}
          className="w-full py-3 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 transition mb-3"
        >
          외부 브라우저로 열기
        </button>

        <details className="text-left mt-4">
          <summary className="text-xs font-bold text-ink-500 cursor-pointer">
            버튼이 동작하지 않는다면
          </summary>
          <div className="mt-2 space-y-1.5 text-[12px] text-ink-700 leading-relaxed">
            <p>
              <strong className="text-ink-900">아이폰</strong> · 우측 하단{" "}
              <span aria-hidden>⋯</span> 아이콘 → <strong>다른 브라우저로 열기</strong> →
              Safari 선택
            </p>
            <p>
              <strong className="text-ink-900">안드로이드</strong> · 우측 상단{" "}
              <span aria-hidden>⋮</span> 아이콘 → <strong>다른 브라우저로 열기</strong>
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}
