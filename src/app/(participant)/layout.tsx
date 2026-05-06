import Link from "next/link"
import { requireAuth } from "@/lib/auth/guards"
import { signOut } from "@/lib/auth/auth"
import { ModeToggle } from "@/components/ModeToggle"
import { BottomNav } from "@/components/BottomNav"
import { AnnouncementBanner } from "@/components/AnnouncementBanner"
import { createServerClient } from "@/lib/supabase/server"

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()
  const isAdmin = session.user.role === 'admin'
  const isParticipant = !!session.user.participant

  const supabase = createServerClient()
  const [settingsRes, hotRes] = await Promise.all([
    supabase
      .from("contest_settings")
      .select("pinned_notice")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("hot_notices")
      .select("id, body, updated_at")
      .order("display_order")
      .order("created_at"),
  ])
  const pinnedNotice = (settingsRes.data?.pinned_notice ?? "").trim()
  const hotNotices = (hotRes.data ?? []).filter((n) => n.body.trim())

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/75 backdrop-blur-xl backdrop-saturate-150 border-b border-line">
        <div className="max-w-3xl mx-auto px-5 h-12 flex items-center justify-between gap-3">
          <Link
            href={isParticipant ? "/dashboard" : "/"}
            className="flex items-center gap-1.5 group shrink-0"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">
              꽉크루 2026
            </span>
          </Link>
          {isAdmin && <ModeToggle current="participant" />}
          <div className="flex items-center gap-3 shrink-0">
            {!isParticipant && (
              <Link
                href="/"
                className="text-xs text-ink-500 hover:text-ink-900 transition font-bold whitespace-nowrap"
              >
                메인
              </Link>
            )}
            {!isParticipant && (
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-ink-500 hover:text-ink-900 transition font-bold"
                >
                  로그아웃
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      {pinnedNotice && (
        <AnnouncementBanner notice={pinnedNotice} variant="pinned" />
      )}
      {hotNotices.map((n) => (
        <AnnouncementBanner
          key={n.id}
          variant="hot"
          id={n.id}
          notice={n.body}
          updatedAt={n.updated_at}
        />
      ))}
      <main className={isParticipant ? "pb-32" : ""}>{children}</main>
      {isParticipant && <BottomNav />}
    </div>
  )
}
