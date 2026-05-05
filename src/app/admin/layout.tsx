import Link from "next/link"
import { requireAdmin } from "@/lib/auth/guards"
import { signOut } from "@/lib/auth/auth"
import { ModeToggle } from "@/components/ModeToggle"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/75 backdrop-blur-xl backdrop-saturate-150 border-b border-line">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin" className="flex items-center gap-1.5 group">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">
                꽉크루 2026
              </span>
            </Link>
            <ModeToggle current="admin" />
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 justify-end">
            <NavLink href="/admin/difficulty">난이도</NavLink>
            <NavLink href="/admin/walls">벽·문제수</NavLink>
            <NavLink href="/admin/participants">참가자</NavLink>
            <NavLink href="/admin/users">회원</NavLink>
            <NavLink href="/admin/schedule">일정</NavLink>
            <NavLink href="/admin/notice">안내문구</NavLink>
            <Link
              href="/"
              className="text-xs text-ink-500 hover:text-ink-900 transition font-bold ml-2 shrink-0 whitespace-nowrap"
            >
              메인
            </Link>
            <Link
              href="/me"
              className="text-xs text-ink-500 hover:text-ink-900 transition font-bold ml-2 shrink-0 whitespace-nowrap"
            >
              내 계정
            </Link>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
              className="ml-2 shrink-0"
            >
              <button
                type="submit"
                className="text-xs text-ink-500 hover:text-ink-900 transition font-bold"
              >
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs font-black text-ink-700 hover:text-ink-900 hover:bg-mute transition px-3 py-1.5 rounded-full whitespace-nowrap"
    >
      {children}
    </Link>
  )
}
