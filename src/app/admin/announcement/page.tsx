import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"
import { AnnouncementEditor } from "./AnnouncementEditor"

export const dynamic = "force-dynamic"

export default async function AdminAnnouncementPage() {
  await requireAdmin()
  const supabase = createServerClient()

  const [settingsRes, hotRes] = await Promise.all([
    supabase
      .from("contest_settings")
      .select("pinned_notice")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("hot_notices")
      .select("id, body, display_order, created_at, updated_at")
      .order("display_order")
      .order("created_at"),
  ])

  return (
    <AnnouncementEditor
      initialPinnedNotice={settingsRes.data?.pinned_notice ?? ""}
      initialHotNotices={hotRes.data ?? []}
    />
  )
}
