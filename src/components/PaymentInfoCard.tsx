import type { PaymentInfo } from "@/lib/contest/load"

type Props = {
  info: PaymentInfo
  variant?: "panel" | "inline"
}

// Dashboard / Record 잠금 / Signup 확인 다이얼로그 어디서든 동일한 정보를 보여주는
// 결제 안내 카드. 운영진이 어드민에서 입력한 값들을 그대로 가져와 노출하며,
// 모바일에서 카카오페이 앱이 자동으로 열리도록 외부 링크는 그대로 a[href]로 둔다.
export function PaymentInfoCard({ info, variant = "panel" }: Props) {
  const hasLinks = !!info.kakaopayLink
  const isEmpty = !hasLinks && !info.notice

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
      {hasLinks && <LinksRow kakaopayLink={info.kakaopayLink} />}
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

function LinksRow({ kakaopayLink }: { kakaopayLink: string }) {
  // 카카오페이 버튼은 primary 결제 수단. 큰 노란색 버튼 + 안내 텍스트로
  // 1탭 송금이 가능함을 한눈에 알리고, 그 아래 fallback인 계좌 정보가 보조 역할.
  return (
    <a
      href={kakaopayLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#FEE500] hover:opacity-90 active:scale-[0.99] transition rounded-2xl p-4 shadow-soft"
    >
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl bg-[#3C1E1E] flex items-center justify-center"
          aria-hidden
        >
          <span className="text-lg">💬</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3C1E1E]/70 mb-0.5">
            RECOMMENDED
          </div>
          <div className="font-black text-base text-[#3C1E1E] leading-tight">
            카카오페이로 1탭 송금
          </div>
          <div className="text-[11px] text-[#3C1E1E]/70 font-bold mt-0.5">
            누르면 카카오페이 앱이 자동으로 열려요
          </div>
        </div>
        <span
          className="shrink-0 text-2xl font-black text-[#3C1E1E]"
          aria-hidden
        >
          →
        </span>
      </div>
    </a>
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
