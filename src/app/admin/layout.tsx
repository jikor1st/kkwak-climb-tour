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

  // 모바일에서는 [브랜드 + 도구 + 아이콘] / [nav] 두 줄로 분리.
  // 한 줄에 다 욱여넣으면 nav 가용폭이 ~38px까지 줄어 거의 안 보였음.
  // sm 이상에서는 한 줄로 펴진다.
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/75 backdrop-blur-xl backdrop-saturate-150 border-b border-line">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row sm:items-center sm:gap-3 py-2 sm:py-0 sm:h-12">
          {/* Row 1 (모바일) / 좌측 영역 (데스크톱) */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 group shrink-0"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">
                꽉크루 2026
              </span>
            </Link>
            <ModeToggle current="admin" />
            <div className="ml-auto flex items-center gap-1 sm:hidden">
              <AccountLink />
              <LogoutButton />
            </div>
          </div>

          {/* Nav — 모바일은 2번째 줄(전폭), 데스크톱은 가운데 인라인 */}
          <nav
            aria-label="운영자 메뉴"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-5 sm:mx-0 px-5 sm:px-0 sm:flex-1 sm:min-w-0 pb-1 sm:pb-0"
          >
            <NavLink href="/admin/difficulty">난이도</NavLink>
            <NavLink href="/admin/walls">벽·문제수</NavLink>
            <NavLink href="/admin/participants">참가자</NavLink>
            <NavLink href="/admin/users">회원</NavLink>
            <NavLink href="/admin/schedule">일정</NavLink>
            <NavLink href="/admin/announcement">공지</NavLink>
            <NavLink href="/admin/notice">결제안내</NavLink>
          </nav>

          {/* 데스크톱 전용 우측 아이콘 */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 pl-1 border-l border-line ml-1">
            <AccountLink />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

function AccountLink() {
  return (
    <Link
      href="/me"
      aria-label="내 계정"
      title="내 계정"
      className="w-8 h-8 rounded-full text-ink-700 hover:text-ink-900 hover:bg-mute transition flex items-center justify-center"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
      </svg>
    </Link>
  )
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
    >
      <button
        type="submit"
        aria-label="로그아웃"
        title="로그아웃"
        className="w-8 h-8 rounded-full text-ink-700 hover:text-accent hover:bg-mute transition flex items-center justify-center"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </form>
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
