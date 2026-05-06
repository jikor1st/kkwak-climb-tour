"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { AnnouncementBanner } from "@/components/AnnouncementBanner"
import { MAX_NOTICE_LENGTH } from "@/lib/utils/notice"

type HotNotice = {
  id: string
  body: string
  display_order: number
  created_at: string
  updated_at: string
}

type Props = {
  initialPinnedNotice: string
  initialHotNotices: HotNotice[]
}

export function AnnouncementEditor({
  initialPinnedNotice,
  initialHotNotices,
}: Props) {
  const [pinned, setPinned] = useState(initialPinnedNotice)
  const [savedPinned, setSavedPinned] = useState(initialPinnedNotice)
  const [pinnedSaving, setPinnedSaving] = useState(false)

  const [hotNotices, setHotNotices] = useState<HotNotice[]>(initialHotNotices)
  const [draftHot, setDraftHot] = useState("")
  const [draftSaving, setDraftSaving] = useState(false)

  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const pinnedDirty = pinned !== savedPinned

  async function savePinned() {
    setPinnedSaving(true)
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned_notice: pinned }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "저장 실패")
      const data = await res.json()
      setSavedPinned(data.pinned_notice ?? "")
      showToast("고정 공지를 저장했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "저장 실패")
    } finally {
      setPinnedSaving(false)
    }
  }

  async function addHot() {
    if (!draftHot.trim()) return
    setDraftSaving(true)
    try {
      const res = await fetch("/api/admin/hot-notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draftHot }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "추가 실패")
      const { notice } = (await res.json()) as { notice: HotNotice }
      setHotNotices((arr) => [...arr, notice])
      setDraftHot("")
      showToast("핫 공지를 추가했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "추가 실패")
    } finally {
      setDraftSaving(false)
    }
  }

  async function updateHot(id: string, body: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/hot-notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "저장 실패")
      const { notice } = (await res.json()) as { notice: HotNotice }
      setHotNotices((arr) => arr.map((n) => (n.id === id ? notice : n)))
      showToast("핫 공지를 저장했어요")
      return true
    } catch (err) {
      showToast(err instanceof Error ? err.message : "저장 실패")
      return false
    }
  }

  async function notifyHot(id: string) {
    if (
      !confirm(
        "이 핫 공지를 모든 알림 구독자에게 푸시로 발송할까요?\n\n동일 공지를 여러 번 보내면 사용자가 피로감을 느낄 수 있어요.",
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/admin/hot-notices/${id}/notify`, {
        method: "POST",
      })
      const data = (await res.json().catch(() => ({}))) as {
        sent?: number
        pruned?: number
        failed?: number
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "발송 실패")
      const sent = data.sent ?? 0
      if (sent === 0) {
        showToast("아직 알림 구독자가 없어요")
      } else {
        showToast(`${sent}명에게 알림을 보냈어요`)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "발송 실패")
    }
  }

  async function deleteHot(id: string) {
    if (!confirm("이 핫 공지를 삭제할까요?")) return
    try {
      const res = await fetch(`/api/admin/hot-notices/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "삭제 실패")
      setHotNotices((arr) => arr.filter((n) => n.id !== id))
      showToast("삭제했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-32">
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          ANNOUNCEMENT
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          참가자 상단 공지
        </h1>
        <p className="text-sm text-ink-700 mt-1.5 leading-relaxed">
          모든 참가자 화면 상단에 두 종류의 배너를 띄울 수 있어요.
          <strong className="text-ink-900"> 고정 공지</strong>는 항상 표시되고,
          <strong className="text-ink-900"> 핫 공지</strong>는 사용자가
          개별적으로 닫을 수 있어요.
        </p>
      </div>

      <FormatHelp />

      <section className="bg-surface border border-line rounded-2xl p-5 shadow-soft mb-6">
        <div className="mb-3">
          <h2 className="text-base font-black">고정 공지 (안내사항)</h2>
          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">
            항상 표시되는 배너. 안전 수칙·연락처처럼 매번 보여줘야 할 안내를
            적어두세요. 비워두면 표시되지 않아요.
          </p>
        </div>
        <AutoTextarea
          value={pinned}
          onChange={setPinned}
          placeholder="예) 안전 수칙: 무리한 도전 금지 / 운영진 카톡: @kkwak"
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[11px] text-ink-500 num">
            {pinned.length} / {MAX_NOTICE_LENGTH}
          </span>
          <button
            type="button"
            onClick={savePinned}
            disabled={!pinnedDirty || pinnedSaving}
            className="px-4 py-2 rounded-lg bg-accent text-white font-black text-xs shadow-pop hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {pinnedSaving ? "저장 중..." : pinnedDirty ? "저장" : "저장됨"}
          </button>
        </div>
        {pinned.trim() && (
          <div className="mt-3">
            <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1.5">
              미리보기
            </div>
            <div className="rounded-xl overflow-hidden border border-line">
              <AnnouncementBanner notice={pinned} variant="pinned" />
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-2xl p-5 shadow-soft mb-6">
        <div className="mb-3">
          <h2 className="text-base font-black">
            핫 공지 (공지사항) · {hotNotices.length}건
          </h2>
          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">
            여러 개 등록할 수 있어요. 사용자가 닫으면 그 디바이스에선 사라집니다.
            본문을 수정해서 저장하면 모두에게 다시 노출돼요.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {hotNotices.map((n) => (
            <HotNoticeRow
              key={n.id}
              notice={n}
              onSave={(body) => updateHot(n.id, body)}
              onDelete={() => deleteHot(n.id)}
              onNotify={() => notifyHot(n.id)}
            />
          ))}
          {hotNotices.length === 0 && (
            <div className="bg-mute/40 rounded-xl p-5 text-center text-xs text-ink-500">
              아직 핫 공지가 없어요. 아래에서 첫 공지를 추가해보세요.
            </div>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2">
            새 핫 공지 추가
          </div>
          <AutoTextarea
            value={draftHot}
            onChange={setDraftHot}
            placeholder="예) 강남 지점 입장이 5분 정도 지연되고 있어요"
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-[11px] text-ink-500 num">
              {draftHot.length} / {MAX_NOTICE_LENGTH}
            </span>
            <button
              type="button"
              onClick={addHot}
              disabled={!draftHot.trim() || draftSaving}
              className="px-4 py-2 rounded-lg bg-accent text-white font-black text-xs shadow-pop hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {draftSaving ? "추가 중..." : "+ 추가"}
            </button>
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900/85 backdrop-blur-md backdrop-saturate-150 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-pop">
          {toast}
        </div>
      )}
    </div>
  )
}

function HotNoticeRow({
  notice,
  onSave,
  onDelete,
  onNotify,
}: {
  notice: HotNotice
  onSave: (body: string) => Promise<boolean>
  onDelete: () => void
  onNotify: () => Promise<void>
}) {
  const [body, setBody] = useState(notice.body)
  const [saving, setSaving] = useState(false)
  const [notifying, setNotifying] = useState(false)

  const dirty = body !== notice.body

  async function save() {
    if (!dirty) return
    setSaving(true)
    await onSave(body)
    setSaving(false)
  }

  async function notify() {
    setNotifying(true)
    try {
      await onNotify()
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="border border-line rounded-xl p-3 bg-mute/20">
      <AutoTextarea
        value={body}
        onChange={setBody}
        placeholder="공지 내용"
      />
      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-ink-500 num">
          <span>{body.length} / {MAX_NOTICE_LENGTH}</span>
          <span aria-hidden>·</span>
          <span>마지막 갱신 {formatTime(notice.updated_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg text-[11px] font-black text-ink-500 hover:text-accent hover:bg-accent-soft transition"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={notify}
            disabled={notifying || dirty}
            title={dirty ? "먼저 저장한 뒤 발송해주세요" : "지금 알림 보내기"}
            className="px-3 py-1.5 rounded-lg bg-ink-900 text-white font-black text-[11px] shadow-pop hover:bg-ink-700 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-1"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {notifying ? "발송 중..." : "알림 발송"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="px-3 py-1.5 rounded-lg bg-accent text-white font-black text-[11px] shadow-pop hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? "저장 중..." : dirty ? "저장" : "저장됨"}
          </button>
        </div>
      </div>
      {body.trim() && (
        <div className="mt-3">
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1.5">
            미리보기
          </div>
          <div className="rounded-xl overflow-hidden border border-line">
            <AnnouncementBanner
              variant="hot"
              id={notice.id}
              notice={body}
              updatedAt={notice.updated_at}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, MAX_NOTICE_LENGTH))}
      placeholder={placeholder}
      rows={2}
      className="w-full min-h-[5rem] px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm leading-relaxed transition resize-none placeholder:text-ink-300 placeholder:font-normal whitespace-pre-wrap font-medium overflow-hidden"
    />
  )
}

function FormatHelp() {
  return (
    <div className="bg-mute/40 rounded-xl p-3 mb-4 text-[11px] text-ink-700 leading-relaxed">
      <strong className="text-ink-900">서식 사용법</strong>
      <div className="mt-1 space-y-0.5">
        <div>
          <code className="font-bold">**굵게**</code> — 핵심 단어를 더 진하게.
          예: <code className="font-bold">**시간 엄수**</code>
        </div>
        <div>
          <code className="font-bold">https://...</code>를 그대로 붙여넣으면
          자동으로 클릭 가능한 링크로 변환돼요.
        </div>
        <div>
          <code className="font-bold">[라벨](https://...)</code> 형식으로 쓰면
          URL 대신 라벨만 노출됩니다. 예:{" "}
          <code className="font-bold">[지도 보기](https://naver.me/abc)</code>
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
