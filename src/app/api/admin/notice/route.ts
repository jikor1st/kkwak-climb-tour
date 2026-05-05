import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MAX_NOTICE = 1000
const MAX_SHORT = 80
const MAX_LINK = 300

const FIELDS = [
  "entry_fee",
  "bank_name",
  "account_number",
  "account_holder",
  "kakaopay_link",
  "toss_link",
  "signup_notice",
] as const

type FieldName = (typeof FIELDS)[number]

function sanitize(field: FieldName, raw: unknown): string | number | null {
  if (field === "entry_fee") {
    if (typeof raw !== "number") return null
    if (!Number.isFinite(raw) || raw < 0 || raw > 10_000_000) return null
    return Math.round(raw)
  }
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  const limit =
    field === "signup_notice" ? MAX_NOTICE : field.endsWith("_link") ? MAX_LINK : MAX_SHORT
  if (trimmed.length > limit) return null
  // 링크는 http/https만 허용 (deeplink 차단 — toss.me, kakaopay.me 등 모두 https 제공됨)
  if (field.endsWith("_link") && trimmed.length > 0) {
    if (!/^https?:\/\//i.test(trimmed)) return null
  }
  return trimmed
}

export async function PATCH(req: Request) {
  await requireAdmin()
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const updates: Record<string, string | number> = {}
  for (const field of FIELDS) {
    if (field in body) {
      const value = sanitize(field, body[field])
      if (value === null) {
        return NextResponse.json(
          { error: `잘못된 값: ${field}` },
          { status: 400 },
        )
      }
      updates[field] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없어요" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("contest_settings")
    .update(updates)
    .eq("id", 1)
    .select(
      "entry_fee, bank_name, account_number, account_holder, kakaopay_link, toss_link, signup_notice",
    )
    .single()

  if (error) {
    console.error("[admin/notice PATCH] error:", error)
    return NextResponse.json({ error: "저장 실패" }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
