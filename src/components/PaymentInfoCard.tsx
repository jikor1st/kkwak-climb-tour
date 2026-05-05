"use client"

import { useState } from "react"
import type { PaymentInfo } from "@/lib/contest/load"

type Props = {
  info: PaymentInfo
  variant?: "panel" | "inline"
}

// Dashboard / Record 잠금 / Signup 확인 다이얼로그 어디서든 동일한 정보를 보여주는
// 결제 안내 카드. 운영진이 어드민에서 입력한 값들을 그대로 가져와 노출하며,
// 모바일에서 송금 앱이 자동으로 열리도록 외부 링크는 그대로 a[href]로 둔다.
export function PaymentInfoCard({ info, variant = "panel" }: Props) {
  const hasAccount = !!info.bankName || !!info.accountNumber || !!info.accountHolder
  const hasLinks = !!info.kakaopayLink || !!info.tossLink
  const isEmpty = !hasAccount && !hasLinks && !info.notice

  if (isEmpty) {
    return (
      <div
        className={
          variant === "inline"
            ? "bg-mute/40 rounded-xl p-4 text-sm text-ink-500 text-center"
            : "bg-surface border-2 border-dashed border-line rounded-2xl p-5 text-sm text-ink-500 text-center"
        }
      >
        아직 입금 안내가 등록되지 않았어요. 운영진이 등록하면 여기에 표시됩니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FeeRow entryFee={info.entryFee} />
      {hasAccount && (
        <AccountRow
          bankName={info.bankName}
          accountNumber={info.accountNumber}
          accountHolder={info.accountHolder}
        />
      )}
      {hasLinks && (
        <LinksRow
          kakaopayLink={info.kakaopayLink}
          tossLink={info.tossLink}
        />
      )}
      {info.notice && <NoticeRow notice={info.notice} />}
    </div>
  )
}

function FeeRow({ entryFee }: { entryFee: number }) {
  return (
    <div className="bg-mute/60 rounded-xl px-4 py-3 flex items-baseline gap-2">
      <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider">
        참가비
      </span>
      <span className="text-lg font-black num text-ink-900">
        {entryFee.toLocaleString()}원
      </span>
    </div>
  )
}

function AccountRow({
  bankName,
  accountNumber,
  accountHolder,
}: {
  bankName: string
  accountNumber: string
  accountHolder: string
}) {
  const [copied, setCopied] = useState(false)
  const copyText = accountNumber.replace(/[^0-9-]/g, "")

  async function copy() {
    if (!copyText) return
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2">
        계좌 송금
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {bankName && (
            <div className="text-xs font-bold text-ink-700 mb-0.5">
              {bankName}
            </div>
          )}
          {accountNumber && (
            <div className="text-base sm:text-lg font-black num text-ink-900 leading-tight break-all">
              {accountNumber}
            </div>
          )}
          {accountHolder && (
            <div className="text-xs text-ink-500 mt-0.5">
              예금주 · <strong className="text-ink-700">{accountHolder}</strong>
            </div>
          )}
        </div>
        {accountNumber && (
          <button
            type="button"
            onClick={copy}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-black transition ${
              copied
                ? "bg-grade-green/15 text-grade-green"
                : "bg-accent text-white shadow-pop hover:bg-accent/90"
            }`}
            aria-label="계좌번호 복사"
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
        )}
      </div>
    </div>
  )
}

function LinksRow({
  kakaopayLink,
  tossLink,
}: {
  kakaopayLink: string
  tossLink: string
}) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2">
        간편 송금 (앱이 자동으로 열려요)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {kakaopayLink ? (
          <a
            href={kakaopayLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-[#FEE500] text-[#000000] font-black text-sm hover:opacity-90 transition"
          >
            <span aria-hidden>💬</span>
            카카오페이
          </a>
        ) : (
          <DisabledLink label="카카오페이" />
        )}
        {tossLink ? (
          <a
            href={tossLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-[#0064FF] text-white font-black text-sm hover:opacity-90 transition"
          >
            <span aria-hidden>💸</span>
            토스
          </a>
        ) : (
          <DisabledLink label="토스" />
        )}
      </div>
    </div>
  )
}

function DisabledLink({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center py-3 rounded-lg bg-mute text-ink-300 font-black text-sm cursor-not-allowed">
      {label} (미등록)
    </span>
  )
}

function NoticeRow({ notice }: { notice: string }) {
  return (
    <div className="bg-mute/40 rounded-xl p-4">
      <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider mb-2">
        추가 안내
      </div>
      <pre className="whitespace-pre-wrap wrap-break-word font-sans text-sm text-ink-900 leading-relaxed">
        {notice}
      </pre>
    </div>
  )
}
