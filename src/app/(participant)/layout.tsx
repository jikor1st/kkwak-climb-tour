import Link from "next/link"
import { requireAuth } from "@/lib/auth/guards"
import { signOut } from "@/lib/auth/auth"
import { ModeToggle } from "@/components/ModeToggle"

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()
  const isAdmin = session.user.role === 'admin'

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-line">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 group shrink-0">
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">
              꽉크루 2026
            </span>
            <span className="hidden sm:inline text-ink-300 text-xs">·</span>
            <span className="hidden sm:inline text-xs font-bold text-ink-700 group-hover:text-ink-900 transition">
              참가자
            </span>
          </Link>
          {isAdmin && <ModeToggle current="participant" />}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="text-xs text-ink-500 hover:text-ink-900 transition font-bold whitespace-nowrap"
            >
              메인
            </Link>
            <Link
              href="/ranking"
              className="text-xs text-ink-500 hover:text-ink-900 transition font-bold whitespace-nowrap"
            >
              순위
            </Link>
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
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
