"use client"

import { useState } from "react"

const MAX_LEN = 1000

const PRESET = `예) 입금 후 신청이 완료됩니다.
계좌: 카카오뱅크 3333-12-1234567 (예금주: 홍길동)
참가비: 10,000원
입금자명은 신청 이름과 동일하게 부탁드립니다.`

export function NoticeEditor({ initialNotice }: { initialNotice: string }) {
  const [notice, setNotice] = useState(initialNotice)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const dirty = notice !== initialNotice

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/notice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signup_notice: notice }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "저장 실패")
      }
      showToast("안내문구를 저장했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "저장 실패")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20">
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          NOTICE
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          참가 신청 안내문구
        </h1>
        <p className="text-sm text-ink-700 mt-1.5">
          참가자가 신청 버튼을 누른 직후 확인 다이얼로그에 표시되는 문구예요.
          입금 계좌·진행 절차 등을 자유롭게 적어주세요.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-soft">
        <label className="block text-[11px] font-black text-ink-700 mb-2 uppercase tracking-wider">
          안내문구 ({notice.length}/{MAX_LEN})
        </label>
        <textarea
          value={notice}
          onChange={(e) => setNotice(e.target.value.slice(0, MAX_LEN))}
          rows={10}
          placeholder={PRESET}
          className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-medium leading-relaxed transition resize-y placeholder:text-ink-300 placeholder:font-normal whitespace-pre-wrap"
        />

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setNotice(PRESET)}
            disabled={saving}
            className="px-3 py-2 rounded-lg bg-mute text-ink-700 font-black text-xs hover:bg-line transition disabled:opacity-40"
          >
            예시 채우기
          </button>
          <button
            type="button"
            onClick={() => setNotice("")}
            disabled={saving || !notice}
            className="px-3 py-2 rounded-lg bg-mute text-ink-500 font-black text-xs hover:bg-line transition disabled:opacity-40"
          >
            비우기
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="ml-auto px-5 py-2.5 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? "저장 중..." : dirty ? "저장" : "저장됨"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-black text-ink-700 uppercase tracking-wider mb-2">
          미리보기
        </div>
        <div className="bg-paper border border-line rounded-2xl p-5 shadow-soft">
          <h3 className="font-black text-base mb-2">참가하시겠습니까?</h3>
          {notice.trim() ? (
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {notice}
            </p>
          ) : (
            <p className="text-sm text-ink-300 italic">
              안내문구가 비어 있으면 다이얼로그에 안내 본문이 보이지 않아요.
            </p>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900/85 backdrop-blur-md backdrop-saturate-150 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-pop">
          {toast}
        </div>
      )}
    </div>
  )
}
