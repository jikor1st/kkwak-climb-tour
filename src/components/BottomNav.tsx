"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  href: string
  label: string
  match: (path: string) => boolean
  icon: (active: boolean) => React.ReactNode
}

const ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "홈",
    match: (p) => p === "/dashboard" || p === "/",
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    href: "/record",
    label: "기록",
    match: (p) => p.startsWith("/record"),
    icon: (active) => <RecordIcon active={active} />,
  },
  {
    href: "/ranking",
    label: "순위",
    match: (p) => p.startsWith("/ranking"),
    icon: (active) => <TrophyIcon active={active} />,
  },
  {
    href: "/me",
    label: "내 계정",
    match: (p) => p.startsWith("/me"),
    icon: (active) => <UserIcon active={active} />,
  },
]

export function BottomNav() {
  const pathname = usePathname() ?? ""
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.875rem)] pointer-events-none">
      <nav
        aria-label="하단 메뉴"
        className="max-w-md mx-auto bg-paper/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-full shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] pointer-events-auto"
      >
        <div className="grid grid-cols-4 px-1.5 py-1.5">
          {ITEMS.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition ${
                  active
                    ? "text-accent bg-accent-soft"
                    : "text-ink-500 hover:text-ink-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  {item.icon(active)}
                </span>
                <span
                  className={`text-[10px] tracking-wider ${
                    active ? "font-black" : "font-bold"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-7h6v7" stroke={active ? "white" : "currentColor"} fill="none" />
    </svg>
  )
}

function RecordIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h10M4 17h7" />
      <path d="m17 14 5 5-2 2-5-5z" fill={active ? "currentColor" : "none"} />
    </svg>
  )
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3" />
      <path d="M9 18h6M12 14v4M8 21h8" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  )
}
