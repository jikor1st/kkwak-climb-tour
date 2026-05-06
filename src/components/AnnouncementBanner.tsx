"use client"

import { useSyncExternalStore } from "react"

export type HotNoticeProps = {
  variant: "hot"
  id: string
  notice: string
  updatedAt: string
}

export type PinnedNoticeProps = {
  variant: "pinned"
  notice: string
}

type Props = HotNoticeProps | PinnedNoticeProps

const STORAGE_KEY = "kkwak_hot_notice_dismissals_v2"

type Dismissals = Record<string, string>

type Listener = () => void
const listeners = new Set<Listener>()

function readDismissals(): Dismissals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function subscribe(cb: Listener): () => void {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

// useSyncExternalStore의 snapshot은 안정적 참조여야 함 — JSON 문자열을 캐싱.
let cachedRaw: string | null = null
let cachedParsed: Dismissals = {}

function getSnapshot(): Dismissals {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return cachedParsed
  }
  if (raw === cachedRaw) return cachedParsed
  cachedRaw = raw
  cachedParsed = readDismissals()
  return cachedParsed
}

const SERVER_DISMISSALS: Dismissals = {}
function getServerSnapshot(): Dismissals {
  return SERVER_DISMISSALS
}

function writeDismissal(id: string, updatedAt: string) {
  const next = { ...cachedParsed, [id]: updatedAt }
  const serialized = JSON.stringify(next)
  try {
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    // localStorage 차단되면 세션 동안만 닫힘
  }
  cachedRaw = serialized
  cachedParsed = next
  listeners.forEach((l) => l())
}

// hot 배너는 localStorage 결과에 따라 SSR/client 간 마크업이 어긋나서
// hydration mismatch 위험. useSyncExternalStore의 getServerSnapshot 패턴으로
// hydration 끝난 뒤에만 렌더하도록 게이트.
const NOOP_SUB = () => () => {}
const CLIENT = () => true
const SERVER = () => false

export function AnnouncementBanner(props: Props) {
  const dismissals = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
  const isClient = useSyncExternalStore(NOOP_SUB, CLIENT, SERVER)

  if (!props.notice.trim()) return null

  const isPinned = props.variant === "pinned"

  if (!isPinned && !isClient) return null

  if (!isPinned) {
    const dismissedAt = dismissals[props.id]
    if (dismissedAt && dismissedAt >= props.updatedAt) return null
  }

  function dismiss() {
    if (isPinned) return
    writeDismissal(props.id, props.updatedAt)
  }

  const label = isPinned ? "안내사항" : "공지사항"

  return (
    <div
      className={
        isPinned
          ? "bg-mute/40 border-b border-line text-ink-900"
          : "bg-surface border-b border-line text-ink-900"
      }
      role="status"
      aria-live="polite"
    >
      <div
        className={`max-w-3xl mx-auto px-5 py-3 flex items-start gap-3 border-l-4 ${
          isPinned ? "border-ink-700/50" : "border-accent"
        }`}
      >
        <div className="shrink-0 mt-0.5 relative" aria-hidden>
          {!isPinned && (
            <span className="absolute inset-0 rounded-full bg-accent/30 live-dot-ring" />
          )}
          <span
            className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
              isPinned
                ? "bg-ink-900/10 text-ink-900"
                : "bg-accent-soft text-accent"
            }`}
          >
            !
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${
              isPinned ? "text-ink-700" : "text-accent"
            }`}
          >
            {label}
          </div>
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap wrap-break-word text-ink-900">
            {renderWithLinks(props.notice)}
          </p>
        </div>
        {!isPinned && (
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 text-ink-500 hover:text-ink-900 transition px-2 py-1 -mr-2 text-lg font-black"
            aria-label="공지 닫기"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// 본문에서 세 가지 패턴을 인식:
//   1) **굵게** — 핵심 단어 강조 (font-black로 렌더)
//   2) 마크다운 [라벨](https://...) — 라벨만 표시되는 깔끔한 링크
//   3) 그대로 붙여넣은 https://... — 자동 감지해서 anchor로 변환
const TOKEN_RE =
  /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')]+)/g

type Token =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; href: string; label: string }

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", value: text.slice(last, m.index) })
    }
    if (m[1]) {
      tokens.push({ type: "bold", value: m[1] })
    } else if (m[2] && m[3]) {
      tokens.push({ type: "link", href: m[3], label: m[2] })
    } else if (m[4]) {
      tokens.push({ type: "link", href: m[4], label: m[4] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length) {
    tokens.push({ type: "text", value: text.slice(last) })
  }
  return tokens
}

function renderWithLinks(text: string): React.ReactNode[] {
  return tokenize(text).map((t, i) => {
    if (t.type === "text") return t.value
    if (t.type === "bold") {
      return (
        <strong key={i} className="font-black text-ink-900">
          {t.value}
        </strong>
      )
    }
    const isBareUrl = t.label === t.href
    return (
      <a
        key={i}
        href={t.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-accent underline underline-offset-2 hover:text-accent/80 transition ${
          isBareUrl ? "break-all" : ""
        }`}
      >
        {t.label}
      </a>
    )
  })
}
