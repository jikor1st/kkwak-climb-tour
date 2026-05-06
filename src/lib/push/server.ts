import "server-only"
import webpush, { type PushSubscription, type SendResult } from "web-push"
import { createServerClient } from "@/lib/supabase/server"

// VAPID 설정. 서버 모듈 로딩 시 한 번만 세팅. 키가 없으면 send 단계에서 throw —
// 빌드 타임에 막진 않는다 (로컬 dev 등 키 없이 빌드 가능해야 함).
let configured = false
function ensureConfigured(): void {
  if (configured) return
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "VAPID 환경변수가 설정되어 있지 않습니다 (VAPID_SUBJECT / NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).",
    )
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export type PushPayload = {
  title: string
  body: string
  // 클릭 시 열릴 절대/상대 경로. 기본 '/'
  url?: string
  // 동일 tag로 도착한 알림은 OS가 합쳐 1개만 표시 (중복 폭주 방지)
  tag?: string
}

type SubscriptionRow = {
  endpoint: string
  p256dh: string
  auth: string
}

function toWebPush(sub: SubscriptionRow): PushSubscription {
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }
}

// 모든 구독에 페이로드 fanout. 410 Gone / 404 Not Found는 만료된 구독으로 보고
// DB에서 정리한다. 실패는 개별 단위로 swallow — 한 endpoint가 죽어도 나머지는 진행.
export async function broadcastPush(
  payload: PushPayload,
): Promise<{ sent: number; pruned: number; failed: number }> {
  ensureConfigured()
  const supabase = createServerClient()

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")

  if (error) {
    console.error("[push] subscriptions fetch failed:", error)
    throw new Error("구독 목록을 불러오지 못했어요")
  }
  if (!subs || subs.length === 0) {
    return { sent: 0, pruned: 0, failed: 0 }
  }

  const body = JSON.stringify(payload)
  const expired: string[] = []
  let sent = 0
  let failed = 0

  const results = await Promise.allSettled(
    subs.map(async (s): Promise<SendResult | null> => {
      try {
        return await webpush.sendNotification(toWebPush(s), body, { TTL: 60 })
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          expired.push(s.endpoint)
          return null
        }
        throw err
      }
    }),
  )

  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value) sent += 1
    } else {
      failed += 1
      console.error("[push] send failed:", r.reason)
    }
  }

  if (expired.length > 0) {
    const { error: delErr } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expired)
    if (delErr) {
      console.error("[push] expired prune failed:", delErr)
    }
  }

  return { sent, pruned: expired.length, failed }
}
