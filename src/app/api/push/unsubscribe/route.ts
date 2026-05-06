import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 클라이언트가 권한 해제했을 때 endpoint 기준으로 row 삭제.
// 인증을 요구하지 않는 이유: 사용자가 로그아웃한 상태에서도 정리할 수 있어야 하고,
// endpoint 자체가 사실상의 토큰 (제3자가 임의로 알 수 없음).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    endpoint?: unknown
  } | null

  if (!body || typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)

  if (error) {
    console.error("[push unsubscribe] error:", error)
    return NextResponse.json({ error: "해제 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
