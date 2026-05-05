import Link from "next/link"
import { requireParticipant } from "@/lib/auth/guards"
import { loadContestData } from "@/lib/contest/load"
import { loadDifficultySystem } from "@/lib/contest/grades"
import { buildTimeline } from "@/lib/contest/schedule"
import { CurrentScheduleStatus } from "@/components/CurrentScheduleStatus"
import { TimelineList } from "@/components/TimelineList"
import { GymProgressList } from "@/components/GymProgressList"
import { CountUpNumber } from "@/components/CountUpNumber"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await requireParticipant()
  const participant = session.user.participant!
  const [contest, system] = await Promise.all([
    loadContestData(participant.id, participant.division_id),
    loadDifficultySystem(),
  ])
  const division = contest.division
  const mainGrade = system.gradesById[participant.main_grade]
  const noWalls = contest.totalCount === 0
  const timeline = buildTimeline(
    contest.settings,
    contest.gyms.map((g) => ({
      id: g.id,
      name: g.name,
      display_order: g.display_order,
      duration_minutes: g.duration_minutes,
    })),
    contest.breaks,
  )
  const contestDateLabel = formatContestDate(contest.settings.contest_date)
  const startEndLabel =
    timeline.startLabel && (timeline.endLabel ?? timeline.computedEndLabel)
      ? `${timeline.startLabel} — ${timeline.endLabel ?? timeline.computedEndLabel}`
      : null
  const scheduleSummary = [
    contestDateLabel !== "미정" ? contestDateLabel : null,
    startEndLabel,
  ]
    .filter(Boolean)
    .join(" · ") || "일정 미정"

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-8 space-y-4">
      {/* 1) 지금 — 실시간 상태 */}
      <CurrentScheduleStatus
        timeline={timeline}
        contestDate={contest.settings.contest_date}
      />

      {/* 2) 나 — 정체성 + 완등 비율 + 단일 주요 CTA */}
      <section className="relative overflow-hidden bg-surface border border-line rounded-3xl p-6 shadow-card">
        <div
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: division.bg }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span
              className="grade-pill"
              style={{
                color: division.color,
                borderColor: division.color,
                background: division.bg,
              }}
            >
              <span
                className="grade-dot"
                style={{ background: division.color }}
              />
              {division.label} · {division.solve_grade_label} 풀이
            </span>
            {mainGrade && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border bg-surface"
                style={{
                  color: mainGrade.color_hex,
                  borderColor: mainGrade.color_hex,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: mainGrade.color_hex }}
                />
                평소 {mainGrade.label}
              </span>
            )}
            <span className="text-[11px] text-ink-500 font-bold">
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
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="text-6xl sm:text-7xl font-black text-accent num leading-none">
              <CountUpNumber value={contest.completionRate} />
              <span className="text-2xl sm:text-3xl">%</span>
            </div>
            <div className="text-sm text-ink-700 num font-bold pb-1">
              {contest.totalSolved} / {contest.totalCount}개 완등
            </div>
          </div>

          <div className="mt-4 h-2 bg-mute rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${contest.completionRate}%` }}
            />
          </div>

          <Link
            href="/record"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 py-4 bg-accent hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(220,38,38,0.28)] active:translate-y-0 transition-all rounded-xl font-black text-white text-base shadow-pop"
          >
            풀이 기록하기 →
          </Link>
          <div className="mt-3 text-center">
            <Link
              href="/ranking"
              className="text-xs font-bold text-ink-500 hover:text-ink-900 transition inline-flex items-center gap-1"
            >
              전체 순위 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 3) 행동 — 지점별 진행 */}
      <section className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-soft">
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
          <GymProgressList
            gyms={contest.gyms.map((g) => ({
              id: g.id,
              name: g.name,
              total_count: g.total_count,
              solved_count: g.solved_count,
            }))}
            timeline={timeline}
            contestDate={contest.settings.contest_date}
            accentColor={division.color}
          />
        )}
      </section>

      {/* 4) 참고 — 전체 일정 */}
      <section className="bg-surface border border-line rounded-2xl p-5 shadow-soft">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-base font-black">전체 일정</h2>
          <div className="text-xs text-ink-500 font-bold truncate num">
            {scheduleSummary}
          </div>
        </div>
        <TimelineList
          timeline={timeline}
          contestDate={contest.settings.contest_date}
        />
      </section>
    </div>
  )
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

function formatContestDate(value: string | null): string {
  if (!value) return "미정"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`
}
