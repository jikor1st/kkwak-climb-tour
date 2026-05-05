"use client"

import { useState } from "react"
import { PaymentInfoCard } from "@/components/PaymentInfoCard"
import type { PaymentInfo } from "@/lib/contest/load"

const MAX_NOTICE = 1000
const MAX_SHORT = 80
const MAX_LINK = 300

export type PaymentSettings = {
  entry_fee: number
  kakaopay_link: string
  signup_notice: string
}

function toPreview(s: PaymentSettings): PaymentInfo {
  return {
    entryFee: s.entry_fee,
    kakaopayLink: s.kakaopay_link.trim(),
    notice: s.signup_notice.trim(),
  }
}

const NOTICE_PRESET = `※ 입금자명은 신청 이름과 동일하게 적어주세요.
※ 입금 확인까지 1~2시간 정도 걸릴 수 있어요.
※ 취소·환불은 대회 3일 전까지 가능합니다. 이후로는 환불이 어려우니 다른 분에게 양도해주세요.
※ 그 외 문의는 운영진 카카오톡으로 편하게 주세요.`

const URL_RE = /^https?:\/\//i

export function NoticeEditor({ initial }: { initial: PaymentSettings }) {
  const [settings, setSettings] = useState<PaymentSettings>(initial)
  const [saved, setSaved] = useState<PaymentSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)
  const linksValid =
    !settings.kakaopay_link.trim() || URL_RE.test(settings.kakaopay_link.trim())
  const feeValid =
    Number.isFinite(settings.entry_fee) &&
    settings.entry_fee >= 0 &&
    settings.entry_fee <= 10_000_000

  function patch<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function save() {
    if (!linksValid) {
      showToast("송금 링크는 https://로 시작해야 해요")
      return
    }
    if (!feeValid) {
      showToast("참가비는 0원 이상으로 입력해주세요")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/notice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_fee: settings.entry_fee,
          kakaopay_link: settings.kakaopay_link.trim(),
          signup_notice: settings.signup_notice,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "저장 실패")
      }
      setSaved(settings)
      showToast("결제 안내를 저장했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "저장 실패")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-32">
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          PAYMENT
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          입금 · 결제 안내
        </h1>
        <p className="text-sm text-ink-700 mt-1.5 leading-relaxed">
          참가자의 대시보드 · 기록 화면 잠금 · 신청 확인 다이얼로그에 동일한
          내용으로 노출됩니다. 핵심 정보(계좌·송금 링크)를 정확히
          채워주세요.
        </p>
      </div>

      <div className="space-y-4">
        {/* 참가비 */}
        <Section
          title="참가비"
          desc="크루·게스트 모두 동일한 금액으로 노출됩니다."
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={settings.entry_fee}
              onChange={(e) =>
                patch("entry_fee", Number(e.target.value) || 0)
              }
              className="flex-1 min-w-0 w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-black num transition"
            />
            <span className="shrink-0 text-sm font-black text-ink-700">원</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[10000, 15000, 20000, 30000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => patch("entry_fee", preset)}
                className="px-2.5 py-1 rounded-full bg-mute hover:bg-line transition text-[11px] font-black text-ink-700 num"
              >
                {preset.toLocaleString()}원
              </button>
            ))}
          </div>
        </Section>

        {/* 간편 송금 */}
        <Section
          title="카카오페이 송금 링크 (선택)"
          desc="누르면 모바일에서 카카오페이 앱이 자동으로 열려 송금 화면으로 이어져요. 비워두면 계좌 송금만 노출됩니다."
        >
          <Field
            label="카카오페이 송금 코드 / QR 링크"
            hint={
              <span className="block space-y-0.5">
                <span className="block">받는 방법:</span>
                <span className="block ml-2">
                  ① 카카오페이 앱 → 하단 <strong>받기</strong> 탭 →{" "}
                  <strong>송금코드</strong> 메뉴
                </span>
                <span className="block ml-2">
                  ② <strong>코드 만들기 / 링크 공유</strong> → 링크 복사
                </span>
                <span className="block ml-2">
                  보통{" "}
                  <code className="font-bold">https://qr.kakaopay.com/</code>{" "}
                  또는{" "}
                  <code className="font-bold">https://kakaopay.me/</code>로
                  시작합니다
                </span>
                <span className="block ml-2 text-grade-green font-bold">
                  ※ 본인이 직접 초기화하지 않는 한{" "}
                  <strong>만료 없이 영구</strong>
                </span>
                <span className="block mt-1.5 p-2 bg-accent-soft/60 border border-accent/20 rounded text-ink-700">
                  💡 <strong className="text-accent">금액 지정 팁</strong> —
                  코드를 만들 때 위 <strong>참가비 금액</strong>(
                  {settings.entry_fee.toLocaleString()}원)을 미리 입력해두면,
                  사용자가 링크 클릭 시 송금 화면에 금액이 자동으로 채워져
                  비밀번호만 누르면 끝나요.
                </span>
              </span>
            }
            error={
              settings.kakaopay_link.trim() &&
              !URL_RE.test(settings.kakaopay_link.trim())
                ? "https://로 시작하는 정식 링크여야 해요"
                : null
            }
          >
            <input
              type="url"
              value={settings.kakaopay_link}
              maxLength={MAX_LINK}
              placeholder="https://qr.kakaopay.com/..."
              onChange={(e) => patch("kakaopay_link", e.target.value)}
              className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm font-bold transition"
            />
          </Field>
          <div className="bg-mute/40 rounded-lg p-3 mt-1 text-[11px] text-ink-700 leading-relaxed">
            <strong className="text-ink-900">참고:</strong> 카카오톡으로 특정
            인물에게 바로 송금을 띄우는 외부 deeplink는 카카오에서 막아두었어요.
            운영진이 본인 카카오페이에서 만든{" "}
            <strong className="text-ink-900">공개 송금 링크</strong>를 입력해두는
            게 가장 빠른 길입니다. 모바일에서 클릭 시 카카오페이 앱이 자동으로
            열려요.
          </div>
        </Section>

        {/* 추가 안내 */}
        <Section
          title="추가 안내 (선택)"
          desc="입금자명 일치 부탁, 환불 정책, 운영진 연락처 등 자유 텍스트. 신청 확인 다이얼로그·대시보드·기록 잠금 화면에 그대로 노출돼요."
        >
          <textarea
            value={settings.signup_notice}
            onChange={(e) =>
              patch("signup_notice", e.target.value.slice(0, MAX_NOTICE))
            }
            rows={7}
            placeholder={NOTICE_PRESET}
            className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-sm leading-relaxed transition resize-y placeholder:text-ink-300 placeholder:font-normal whitespace-pre-wrap font-medium"
          />
          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => patch("signup_notice", NOTICE_PRESET)}
                className="px-3 py-1.5 rounded-lg bg-accent-soft border border-accent/30 text-accent font-black text-xs hover:bg-accent hover:text-white transition"
              >
                ✦ 추천 문구로 채우기
              </button>
              {settings.signup_notice.trim() && (
                <button
                  type="button"
                  onClick={() => patch("signup_notice", "")}
                  className="px-3 py-1.5 rounded-lg bg-mute text-ink-500 font-black text-xs hover:bg-line transition"
                >
                  비우기
                </button>
              )}
            </div>
            <span className="text-[11px] text-ink-500 num">
              {settings.signup_notice.length} / {MAX_NOTICE}
            </span>
          </div>
          <div className="mt-3 bg-mute/40 rounded-lg p-3 text-[11px] text-ink-700 leading-relaxed">
            <strong className="text-ink-900">추천 문구 미리보기</strong>
            <pre className="whitespace-pre-wrap wrap-break-word font-sans mt-1.5 text-ink-700">{NOTICE_PRESET}</pre>
          </div>
        </Section>

        {/* 저장 바 */}
        <div className="sticky bottom-3 z-30 bg-paper/85 backdrop-blur-xl backdrop-saturate-150 border border-line rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card">
          <span className="text-xs text-ink-500 font-bold">
            {dirty ? "저장하지 않은 변경 사항이 있어요" : "최신 상태로 저장됨"}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || !linksValid || !feeValid}
            className="ml-auto px-5 py-2.5 rounded-xl bg-accent text-white font-black text-sm shadow-pop hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* 미리보기 */}
        <div>
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2 mt-4">
            참가자 화면 미리보기
          </div>
          <div className="bg-surface border-2 border-accent/30 rounded-3xl p-5 shadow-card">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="shrink-0 w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center text-base font-black shadow-pop"
                aria-hidden
              >
                ₩
              </div>
              <div>
                <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                  ENTRY PENDING
                </div>
                <h2 className="text-base font-black tracking-tight">
                  입금 안내
                </h2>
              </div>
            </div>
            <PaymentInfoCard info={toPreview(settings)} variant="inline" />
          </div>
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

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface border border-line rounded-2xl p-5 shadow-soft space-y-3">
      <div>
        <h2 className="text-base font-black">{title}</h2>
        {desc && (
          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{desc}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: React.ReactNode
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-accent font-bold mt-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-ink-500 mt-1 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  )
}
