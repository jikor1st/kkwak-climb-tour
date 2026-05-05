"use client"

import { useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { TextInputDialog } from "@/components/TextInputDialog"

export type UserRow = {
  id: string
  kakao_id: string
  nickname: string
  role: "admin" | "participant"
  created_at: string
  participant: {
    id: string
    display_name: string
    paid: boolean
  } | null
}

type Filter = "all" | "admin" | "participant" | "guest" // guest = 가입만 한 유저

export function UserList({
  rows,
  currentUserId,
}: {
  rows: UserRow[]
  currentUserId: string
}) {
  const [data, setData] = useState(rows)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null)
  const [renameTarget, setRenameTarget] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function changeRole(row: UserRow) {
    const nextRole: "admin" | "participant" =
      row.role === "admin" ? "participant" : "admin"
    setData((d) =>
      d.map((r) => (r.id === row.id ? { ...r, role: nextRole } : r)),
    )
    setPending((p) => new Set(p).add(row.id))
    try {
      const res = await fetch(`/api/admin/users/${row.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "권한 변경 실패")
      }
      showToast(
        nextRole === "admin"
          ? `${row.nickname}님에게 어드민 권한을 부여했어요`
          : `${row.nickname}님의 어드민 권한을 해제했어요`,
      )
    } catch (err) {
      setData((d) =>
        d.map((r) => (r.id === row.id ? { ...r, role: row.role } : r)),
      )
      showToast(err instanceof Error ? err.message : "권한 변경 실패")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

  async function renameUser(row: UserRow, nickname: string) {
    const prev = row.nickname
    setData((d) =>
      d.map((r) => (r.id === row.id ? { ...r, nickname } : r)),
    )
    setPending((p) => new Set(p).add(row.id))
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "이름 변경 실패")
      }
      showToast(`이름을 ${nickname}(으)로 변경했어요`)
    } catch (err) {
      setData((d) =>
        d.map((r) => (r.id === row.id ? { ...r, nickname: prev } : r)),
      )
      showToast(err instanceof Error ? err.message : "이름 변경 실패")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

  async function deleteUser(row: UserRow) {
    setPending((p) => new Set(p).add(row.id))
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "삭제 실패")
      }
      setData((d) => d.filter((r) => r.id !== row.id))
      showToast("회원을 삭제했어요")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제 실패")
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(row.id)
        return next
      })
    }
  }

  const stats = useMemo(() => {
    const total = data.length
    const adminCount = data.filter((r) => r.role === "admin").length
    const participantCount = data.filter((r) => r.participant !== null).length
    const guestCount = total - participantCount
    return { total, admin: adminCount, participant: participantCount, guest: guestCount }
  }, [data])

  const filtered = useMemo(() => {
    let list = data
    if (filter === "admin") list = list.filter((r) => r.role === "admin")
    else if (filter === "participant")
      list = list.filter((r) => r.participant !== null)
    else if (filter === "guest")
      list = list.filter((r) => r.participant === null)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.nickname.toLowerCase().includes(q) ||
          (r.participant?.display_name.toLowerCase().includes(q) ?? false) ||
          r.kakao_id.includes(q),
      )
    }
    return list
  }, [data, filter, query])

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 pb-20">
      {/* Header */}
      <div className="mb-5">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
          ADMIN · USERS
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          회원 · 권한 관리
        </h1>
        <p className="text-sm text-ink-700 mt-1.5 leading-relaxed">
          카카오로 로그인한 모든 회원입니다. 참가 신청 여부와 관계없이 어드민 권한을
          줄 수 있어요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <Stat label="전체 회원" value={stats.total} />
        <Stat label="어드민" value={stats.admin} accent="green" />
        <Stat label="참가자" value={stats.participant} />
        <Stat label="가입만" value={stats.guest} accent="gray" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {stats.total}
        </FilterChip>
        <FilterChip
          active={filter === "admin"}
          onClick={() => setFilter("admin")}
        >
          어드민 {stats.admin}
        </FilterChip>
        <FilterChip
          active={filter === "participant"}
          onClick={() => setFilter("participant")}
        >
          참가자 {stats.participant}
        </FilterChip>
        <FilterChip
          active={filter === "guest"}
          onClick={() => setFilter("guest")}
        >
          가입만 {stats.guest}
        </FilterChip>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·닉네임 검색..."
          className="ml-auto px-3 py-2 bg-surface border border-line focus:border-ink-900 rounded-lg outline-none text-sm font-bold transition w-full sm:w-56 placeholder:font-normal placeholder:text-ink-300"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900/85 backdrop-blur-md backdrop-saturate-150 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-pop max-w-sm text-center">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={roleTarget !== null}
        title={
          roleTarget?.role === "admin"
            ? "어드민 권한을 해제할까요?"
            : "어드민 권한을 부여할까요?"
        }
        variant={roleTarget?.role === "admin" ? "danger" : "default"}
        confirmLabel={
          roleTarget?.role === "admin" ? "권한 해제" : "어드민 부여"
        }
        message={
          roleTarget ? (
            roleTarget.role === "admin" ? (
              <>
                <strong className="text-ink-900">
                  {roleTarget.participant?.display_name ?? roleTarget.nickname}
                </strong>{" "}
                님이 더 이상 어드민 페이지에 접근할 수 없게 돼요.
              </>
            ) : (
              <>
                <strong className="text-ink-900">
                  {roleTarget.participant?.display_name ?? roleTarget.nickname}
                </strong>{" "}
                님에게 어드민 권한을 부여하면 모든 운영 데이터를 수정할 수 있어요.
                {roleTarget.participant === null && (
                  <span className="block mt-2 text-xs text-ink-500">
                    이 회원은 아직 참가 신청을 하지 않은 상태입니다.
                  </span>
                )}
              </>
            )
          ) : null
        }
        onConfirm={() => {
          const t = roleTarget
          setRoleTarget(null)
          if (t) changeRole(t)
        }}
        onCancel={() => setRoleTarget(null)}
      />

      <TextInputDialog
        open={renameTarget !== null}
        title="회원 이름 변경"
        subtitle={
          renameTarget
            ? `${renameTarget.nickname?.trim() || "이름 미입력"} 회원의 이름`
            : undefined
        }
        placeholder="실명"
        confirmLabel="저장"
        initialValue={renameTarget?.nickname ?? ""}
        validate={(v) =>
          v.length > 20 ? "이름은 20자 이내" : null
        }
        onConfirm={(name) => {
          const t = renameTarget
          setRenameTarget(null)
          if (t && name.trim() !== t.nickname) renameUser(t, name.trim())
        }}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 회원을 삭제할까요?"
        variant="danger"
        confirmLabel="완전 삭제"
        message={
          deleteTarget ? (
            <>
              <strong className="text-ink-900">
                {deleteTarget.participant?.display_name?.trim() ||
                  deleteTarget.nickname?.trim() ||
                  `회원-${deleteTarget.kakao_id.slice(-6)}`}
              </strong>{" "}
              회원 계정과 연결된 참가자 정보·풀이 기록이 모두 영구 삭제됩니다.
              되돌릴 수 없어요.
            </>
          ) : null
        }
        onConfirm={() => {
          const t = deleteTarget
          setDeleteTarget(null)
          if (t) deleteUser(t)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-500">
          {data.length === 0
            ? "아직 가입한 회원이 없어요."
            : "조건에 맞는 회원이 없어요."}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-soft">
          <ul className="divide-y divide-line">
            {filtered.map((row) => {
              const isMe = row.id === currentUserId
              const isAdmin = row.role === "admin"
              const isParticipant = row.participant !== null
              const realName = row.nickname?.trim() || null
              const displayName = row.participant?.display_name?.trim() || null
              const primaryName =
                realName ?? displayName ?? `회원-${row.kakao_id.slice(-6)}`
              const showSecondary =
                realName && displayName && realName !== displayName
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-mute/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black truncate">
                        {primaryName}
                      </span>
                      {showSecondary && (
                        <span className="text-[11px] text-ink-500 font-bold truncate">
                          ({displayName})
                        </span>
                      )}
                      {!realName && (
                        <span
                          className="text-[10px] font-black text-accent bg-accent-soft border border-accent/30 px-1.5 py-0.5 rounded"
                          title="아직 이름을 입력하지 않은 회원"
                        >
                          이름 미입력
                        </span>
                      )}
                      {isAdmin && (
                        <span className="text-[10px] font-black text-white bg-ink-900 px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-black text-accent">
                          (나)
                        </span>
                      )}
                      {isParticipant ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            row.participant!.paid
                              ? "bg-grade-green/10 text-grade-green"
                              : "bg-mute text-ink-700"
                          }`}
                        >
                          {row.participant!.paid ? "참가·입금완료" : "참가·미입금"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mute text-ink-500">
                          미참가
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5 num">
                      카카오 …{row.kakao_id.slice(-6)} · 가입{" "}
                      {new Date(row.created_at).toLocaleDateString("ko-KR", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoleTarget(row)}
                    disabled={pending.has(row.id) || isMe}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      isAdmin
                        ? "bg-ink-900 text-white hover:bg-ink-700"
                        : "bg-surface text-ink-700 border border-line hover:border-ink-900"
                    }`}
                    title={
                      isMe
                        ? "본인 권한은 변경할 수 없어요"
                        : isAdmin
                          ? "어드민 권한 해제"
                          : "어드민 권한 부여"
                    }
                  >
                    {pending.has(row.id)
                      ? "변경중..."
                      : isAdmin
                        ? "★ 어드민"
                        : "☆ 어드민 부여"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenameTarget(row)}
                    disabled={pending.has(row.id)}
                    className="shrink-0 w-9 h-9 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-mute flex items-center justify-center transition disabled:opacity-40"
                    aria-label="이름 변경"
                    title="이름 변경"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    disabled={pending.has(row.id) || isMe}
                    className="shrink-0 w-9 h-9 rounded-lg text-ink-300 hover:text-accent hover:bg-accent-soft flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="회원 삭제"
                    title={
                      isMe
                        ? "본인은 내 계정 페이지에서 탈퇴하세요"
                        : "회원 삭제"
                    }
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: "green" | "gray"
}) {
  const color =
    accent === "green"
      ? "text-grade-green"
      : accent === "gray"
        ? "text-ink-500"
        : "text-ink-900"
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2.5 shadow-soft">
      <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold">
        {label}
      </div>
      <div className={`text-xl font-black num leading-tight mt-0.5 ${color}`}>
        {value}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-black px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-ink-900 text-white border-ink-900"
          : "bg-surface text-ink-700 border-line hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  )
}
