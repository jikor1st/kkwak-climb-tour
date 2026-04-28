import Link from "next/link"

type Mode = "admin" | "participant"

export function ModeToggle({ current }: { current: Mode }) {
  const cell = (mode: Mode, href: string, label: string) => {
    const active = mode === current
    return (
      <Link
        href={href}
        className={`px-3 py-1 text-[11px] font-black rounded-full transition whitespace-nowrap ${
          active
            ? "bg-ink-900 text-white shadow-soft"
            : "text-ink-500 hover:text-ink-900"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="inline-flex items-center rounded-full bg-mute p-0.5 shrink-0 border border-line">
      {cell("participant", "/dashboard", "참가자")}
      {cell("admin", "/admin", "운영자")}
    </div>
  )
}
