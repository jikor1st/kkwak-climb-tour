import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NoticeEditor, type PaymentSettings } from "./NoticeEditor"

export const dynamic = "force-dynamic"

export default async function AdminNoticePage() {
  await requireAdmin()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("contest_settings")
    .select("entry_fee, kakaopay_link, signup_notice")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    console.error("[admin/notice] load error:", error)
  }

  const initial: PaymentSettings = {
    entry_fee: data?.entry_fee ?? 10000,
    kakaopay_link: data?.kakaopay_link ?? "",
    signup_notice: data?.signup_notice ?? "",
  }

  return <NoticeEditor initial={initial} />
}
