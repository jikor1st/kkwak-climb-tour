import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { broadcastPush } from "@/lib/push/server"
import { NextResponse } from "next/server"

// 어드민이 핫 공지를 골라 수동으로 푸시 발송.
// 공지 본문을 그대로 푸시 body에 실어 보낸다 — 사용자별 dismiss 상태와는 별개로,
// 어드민이 직접 누른 시점의 알림이므로 항상 전송한다.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params
  const supabase = createServerClient()

  const { data: notice, error } = await supabase
    .from("hot_notices")
    .select("id, body")
    .eq("id", id)
    .maybeSingle()

  if (error || !notice) {
    return NextResponse.json({ error: "공지를 찾을 수 없어요" }, { status: 404 })
  }

  // 마크다운/링크 문법은 푸시에서 보기 어려워 단순 텍스트로 정리.
  const plain = stripMarkup(notice.body).slice(0, 180)

  try {
    const result = await broadcastPush({
      title: "꽉크루 공지",
      body: plain,
      url: "/dashboard",
      tag: `hot-notice-${notice.id}`,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[hot-notice notify] broadcast failed:", err)
    const msg = err instanceof Error ? err.message : "발송 실패"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function stripMarkup(s: string): string {
  return s
    // [라벨](url) → 라벨
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    // **굵게** → 굵게
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    // 남은 raw URL은 그대로 둠 (잘려도 의미 손상 적음)
    .replace(/\s+/g, " ")
    .trim()
}
