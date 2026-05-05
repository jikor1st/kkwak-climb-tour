"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function NameForm({
  initialName,
  hasExistingParticipant = false,
}: {
  initialName: string
  hasExistingParticipant?: boolean
}) {
  const router = useRouter()
  const { update } = useSession()
  const [name, setName] = useState(initialName.trim())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("이름을 입력해주세요")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "저장 실패")
      await update()
      router.replace("/post-login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5 py-10">
      <div className="max-w-md w-full bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="mb-5">
          <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1.5">
            {hasExistingParticipant ? "회원 정보 보완" : "회원 가입"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            이름을 알려주세요
          </h1>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">
            {hasExistingParticipant ? (
              <>
                회원 식별을 위해 이름이 필요해요. 참가 신청 시 입력한 이름이
                기본으로 채워져 있고, 그대로 저장하셔도 됩니다.
              </>
            ) : (
              <>
                대회 운영진이 누가 누군지 식별할 수 있도록 실명을 입력해주세요.
                저장하면 바로 참가 신청 화면으로 넘어가요.
              </>
            )}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-black text-ink-700 mb-1.5 uppercase tracking-wider">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
              maxLength={20}
              autoFocus
              placeholder="예: 홍길동"
              className="w-full px-4 py-3.5 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-bold transition placeholder:font-normal placeholder:text-ink-300"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={`text-xs ${
                  error ? "text-accent font-black" : "text-ink-500"
                }`}
              >
                {error || "1~20자 이내"}
              </span>
              <span className="text-[11px] text-ink-500 font-bold num">
                {name.length}/20
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-4 bg-accent text-white font-black text-base rounded-xl shadow-pop hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "저장 중..." : "다음 →"}
          </button>
        </form>
      </div>
    </div>
  )
}
