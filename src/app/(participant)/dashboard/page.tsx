import Link from "next/link"
import { requireParticipant } from "@/lib/auth/guards"
import { loadContestData } from "@/lib/contest/load"
import {
  CATEGORY_META,
  GRADE_COLOR,
  GRADE_LABEL,
  type Category,
} from "@/lib/contest/grades"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await requireParticipant()
  const participant = session.user.participant!
  const contest = await loadContestData(
    participant.id,
    participant.category as Category,
  )
  const meta = CATEGORY_META[participant.category as Category]
  const noWalls = contest.totalCount === 0

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20">
      {/* Hero card */}
      <div className="relative overflow-hidden bg-surface border border-line rounded-3xl p-6 sm:p-7 shadow-card mb-4">
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30"
          style={{ background: meta.bg }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span
              className="grade-pill"
              style={{
                color: meta.color,
                borderColor: meta.color,
                background: meta.bg,
              }}
            >
              <span
                className="grade-dot"
                style={{ background: meta.color }}
              />
              {meta.label}조 · {meta.solveLabel}
            </span>
            <span className="text-xs text-ink-500 font-bold">
              {participant.participant_type === "crew" ? "꽉크루" : "게스트"}
            </span>
            {!participant.paid && (
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-mute text-ink-700 tracking-wider">
                입금 대기
              </span>
            )}
          </div>

          <div className="text-xs text-ink-500 mb-1.5 font-bold tracking-wider">
            {participant.display_name}님의 완등 비율
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-6xl sm:text-7xl font-black text-accent num leading-none">
                {contest.completionRate}
                <span className="text-2xl sm:text-3xl">%</span>
              </div>
              <div className="text-sm text-ink-700 mt-2 num">
                {contest.totalSolved} / {contest.totalCount}개 완등
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs text-ink-500 font-bold mb-1">
                평소 푸는 색
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black border-2"
                style={{
                  color: GRADE_COLOR[participant.main_grade] ?? "#6B7280",
                  borderColor:
                    GRADE_COLOR[participant.main_grade] ?? "#6B7280",
                  background: "#FFFFFF",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: GRADE_COLOR[participant.main_grade] ?? "#6B7280",
                  }}
                />
                {GRADE_LABEL[participant.main_grade] ?? participant.main_grade}
              </span>
            </div>
          </div>

          <div className="mt-5 h-2 bg-mute rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${contest.completionRate}%` }}
            />
          </div>

          <Link
            href="/record"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent/90 transition rounded-xl font-black text-white text-base shadow-pop"
          >
            풀이 기록하기 →
          </Link>
        </div>
      </div>

      {/* 지점별 진행 */}
      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-soft mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black">지점별 진행</h2>
          <Link
            href="/record"
            className="text-xs font-black text-accent hover:opacity-80"
          >
            기록 입력 →
          </Link>
        </div>

        {noWalls ? (
          <div className="bg-mute rounded-xl p-5 text-center text-sm text-ink-700">
            <div className="font-black mb-1">아직 벽 정보가 없어요</div>
            <p className="text-xs text-ink-500">
              운영진이 각 지점의 벽과 문제 수를 입력하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {contest.gyms.map((gym, i) => {
              const ratio =
                gym.total_count > 0
                  ? Math.round((gym.solved_count / gym.total_count) * 100)
                  : 0
              const empty = gym.total_count === 0
              return (
                <Link
                  key={gym.id}
                  href={`/record?gym=${gym.id}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-line hover:border-line-strong transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-mute flex items-center justify-center text-xs font-black text-ink-700 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black">{gym.name}</span>
                      {ratio === 100 && gym.total_count > 0 && (
                        <span className="text-[10px] font-black text-grade-green tracking-wider">
                          ✓ 완료
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 h-1 bg-mute rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ratio}%`,
                          background: empty ? "transparent" : meta.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0 num">
                    {empty ? (
                      <span className="text-xs text-ink-300 font-bold">
                        벽 미등록
                      </span>
                    ) : (
                      <>
                        <div className="text-sm font-black">
                          {gym.solved_count}
                          <span className="text-ink-500">/{gym.total_count}</span>
                        </div>
                        <div className="text-[10px] text-ink-500 font-bold">
                          {ratio}%
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-ink-300 text-sm group-hover:text-ink-700 transition">
                    →
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 대회 정보 */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-soft">
        <div className="text-xs text-ink-500 uppercase tracking-wider mb-3 font-black">
          대회 정보
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">일시</span>
            <span className="font-black">2026년 5월 10일 (토)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">시간</span>
            <span className="font-black num">09:30 — 16:50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">참가 유형</span>
            <span className="font-black">
              {participant.participant_type === "crew" ? "꽉크루 멤버" : "게스트"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block text-xs text-ink-500 hover:text-ink-900 transition font-bold"
        >
          ← 메인으로
        </Link>
      </div>
    </div>
  )
}
