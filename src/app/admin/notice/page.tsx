import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { NoticeEditor } from "./NoticeEditor"

export const dynamic = "force-dynamic"

export default async function AdminNoticePage() {
  await requireAdmin()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("contest_settings")
    .select("signup_notice")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    console.error("[admin/notice] load error:", error)
  }

  return <NoticeEditor initialNotice={data?.signup_notice ?? ""} />
}
