import { auth } from "@/lib/auth/auth"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 클라이언트가 PushSubscription을 만든 뒤 서버에 등록.
// endpoint를 PK로 upsert — 같은 디바이스에서 권한 토글을 반복해도 row가 늘지 않는다.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  } | null

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  }

  const { endpoint, keys } = body
  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://") ||
    typeof keys?.p256dh !== "string" ||
    typeof keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "구독 형식이 올바르지 않아요" }, { status: 400 })
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null

  const supabase = createServerClient()
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint,
        user_id: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

  if (error) {
    console.error("[push subscribe] error:", error)
    return NextResponse.json({ error: "등록 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
