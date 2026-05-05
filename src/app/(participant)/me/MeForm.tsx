"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { ConfirmDialog } from "@/components/ConfirmDialog"

type MeUser = {
  id: string
  nickname: string
  role: "admin" | "participant"
  kakao_id: string
  created_at: string
}

type MeParticipant = {
  id: string
  display_name: string
  paid: boolean
} | null

export function MeForm({
  user,
  participant,
}: {
  user: MeUser
  participant: MeParticipant
}) {
  const router = useRouter()
  const { update } = useSession()
  const [name, setName] = useState(user.nickname)
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState("")
  const [nameNotice, setNameNotice] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const dirty = name.trim() !== user.nickname.trim() && name.trim().length > 0
  const isAdmin = user.role === "admin"

  async function saveName() {
    if (!dirty) return
    setSavingName(true)
    setNameError("")
    setNameNotice("")
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "저장 실패")
      await update()
      setNameNotice("저장됨")
      setTimeout(() => setNameNotice(""), 2500)
      router.refresh()
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "저장 실패")
    } finally {
      setSavingName(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch("/api/me", { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "탈퇴 실패")
      await signOut({ callbackUrl: "/" })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "탈퇴 실패")
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="max-w-xl mx-auto px-5 pt-8">
        <div className="mb-6">
          <Link
            href={participant ? "/dashboard" : "/"}
            className="text-xs text-ink-500 hover:text-ink-900 transition font-bold inline-block mb-2"
          >
            ← 돌아가기
          </Link>
          <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1">
            MY ACCOUNT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            내 계정
          </h1>
        </div>

        {/* 상태 카드 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-soft mb-4">
          <div className="text-[10px] text-ink-500 uppercase tracking-wider font-black mb-2">
            현재 상태
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <span className="text-[11px] font-black text-white bg-ink-900 px-2 py-1 rounded">
                ADMIN
              </span>
            )}
            {participant ? (
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded ${
                  participant.paid
                    ? "bg-grade-green/10 text-grade-green"
                    : "bg-mute text-ink-700"
                }`}
              >
                {participant.paid ? "참가·입금완료" : "참가·미입금"}
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-1 rounded bg-mute text-ink-500">
                미참가
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-500 mt-3 num">
            카카오 …{user.kakao_id.slice(-6)} · 가입{" "}
            {new Date(user.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </div>
        </div>

        {/* 이름 변경 */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-soft mb-4">
          <div className="text-[10px] text-ink-500 uppercase tracking-wider font-black mb-1">
            이름
          </div>
          <p className="text-xs text-ink-500 mb-3 leading-relaxed">
            랭킹·기록·운영진 식별에 모두 사용되는 이름입니다.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) setNameError("")
              if (nameNotice) setNameNotice("")
            }}
            maxLength={20}
            className="w-full px-4 py-3 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-bold transition"
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs font-bold ${
                nameError
                  ? "text-accent"
                  : nameNotice
                    ? "text-grade-green"
                    : "text-ink-500"
              }`}
            >
              {nameError || nameNotice || "1~20자 이내"}
            </span>
            <button
              type="button"
              onClick={saveName}
              disabled={!dirty || savingName}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-black shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {savingName ? "저장 중..." : "이름 저장"}
            </button>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full bg-surface border border-line rounded-2xl px-5 py-4 text-sm font-black text-ink-700 hover:bg-mute transition mb-4"
        >
          로그아웃
        </button>

        {/* 회원 탈퇴 */}
        <div className="bg-surface border border-accent/20 rounded-2xl p-5 shadow-soft">
          <div className="text-[10px] text-accent uppercase tracking-wider font-black mb-1">
            DANGER ZONE
          </div>
          <h2 className="font-black text-base mb-1">회원 탈퇴</h2>
          <p className="text-xs text-ink-500 leading-relaxed mb-3">
            카카오 회원 정보·참가 신청·풀이 기록이 모두 영구 삭제됩니다. 되돌릴 수
            없어요.
          </p>
          {deleteError && (
            <div className="text-xs text-accent font-bold mb-3">
              ⚠️ {deleteError}
            </div>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="w-full px-5 py-3 rounded-xl bg-accent-soft border border-accent/30 text-accent font-black text-sm hover:bg-accent hover:text-white transition disabled:opacity-50"
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="정말 탈퇴할까요?"
        variant="danger"
        confirmLabel="탈퇴 진행"
        message={
          <>
            <strong className="text-ink-900">{user.nickname || "내"}</strong>{" "}
            계정과 연결된 참가 신청·풀이 기록이 모두 영구 삭제됩니다. 이 작업은
            되돌릴 수 없어요.
          </>
        }
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
