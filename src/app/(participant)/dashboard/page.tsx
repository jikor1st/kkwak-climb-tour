import Link from "next/link"
import { requireParticipant } from "@/lib/auth/guards"
import { loadContestData, buildPaymentInfo } from "@/lib/contest/load"
import { loadDifficultySystem } from "@/lib/contest/grades"
import { buildTimeline } from "@/lib/contest/schedule"
import { todayDateStringKST } from "@/lib/contest/timeline-now"
import { CurrentScheduleStatus } from "@/components/CurrentScheduleStatus"
import { TimelineList } from "@/components/TimelineList"
import { GymProgressList } from "@/components/GymProgressList"
import { CountUpNumber } from "@/components/CountUpNumber"
import { PaymentInfoCard } from "@/components/PaymentInfoCard"

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
    timeline.startLabel && timeline.endLabel
      ? `${timeline.startLabel} — ${timeline.endLabel}`
      : null
  const scheduleSummary = [
    contestDateLabel !== "미정" ? contestDateLabel : null,
    startEndLabel,
  ]
    .filter(Boolean)
    .join(" · ") || "일정 미정"

  // 상태별 메인 CTA — 잘못된 affordance(잠긴 상태에서 "기록하기")를 줄이고
  // 사용자가 지금 할 수 있는 행동을 안내한다.
  // 미입금 상태면 입금 안내 카드를 같은 페이지 하단에 직접 렌더하므로
  // CTA는 외부 라우팅 대신 anchor 스크롤로 처리한다.
  const today = todayDateStringKST()
  const contestOver =
    !!contest.settings.contest_date && contest.settings.contest_date < today
  const daysUntil = contest.settings.contest_date
    ? diffDaysKST(today, contest.settings.contest_date)
    : null
  const promoteTimeline = daysUntil === 0 || daysUntil === 1
  const paymentInfo = buildPaymentInfo(contest.settings)
  const primaryCta = !participant.paid
    ? {
        href: "#payment-info",
        label: "입금 안내 보기 ↓",
        sub: "운영진이 입금을 확인하면 자동으로 기록 화면이 열려요",
      }
    : contestOver
      ? {
          href: "/ranking",
          label: "최종 결과 보기 →",
          sub: null as string | null,
        }
      : {
          href: "/record",
          label: "풀이 기록하기 →",
          sub: null as string | null,
        }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-8 space-y-4">
      {/* 1) 지금 — 실시간 상태 */}
      <CurrentScheduleStatus
        timeline={timeline}
        contestDate={contest.settings.contest_date}
      />

      {promoteTimeline && (
        <section className="bg-surface border-2 border-accent/40 rounded-3xl p-5 sm:p-6 shadow-card">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                {daysUntil === 0 ? "오늘 동선" : "내일 동선"}
              </span>
            </div>
            <div className="text-xs text-ink-500 font-bold truncate num">
              {scheduleSummary}
            </div>
          </div>
          <TimelineList
            timeline={timeline}
            contestDate={contest.settings.contest_date}
          />
        </section>
      )}

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
            href={primaryCta.href}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 py-4 bg-accent hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(220,38,38,0.28)] active:translate-y-0 transition-all rounded-xl font-black text-white text-base shadow-pop"
          >
            {primaryCta.label}
          </Link>
          {primaryCta.sub && (
            <p className="mt-3 text-center text-xs text-ink-500 font-bold leading-relaxed">
              {primaryCta.sub}
            </p>
          )}
          {primaryCta.href !== "/ranking" && (
            <div className="mt-3 text-center">
              <Link
                href="/ranking"
                className="text-xs font-bold text-ink-500 hover:text-ink-900 transition inline-flex items-center gap-1"
              >
                전체 순위 보기 →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 입금 안내 — 미입금 참가자에게만 표시. 별도 페이지로 빼지 않고
          대시보드에서 바로 보이도록 인라인 렌더한다. */}
      {!participant.paid && (
        <section
          id="payment-info"
          className="scroll-mt-16 bg-surface border-2 border-accent/30 rounded-3xl p-5 sm:p-6 shadow-card"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="shrink-0 w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center text-base font-black shadow-pop"
              aria-hidden
            >
              ₩
            </div>
            <div>
              <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                ENTRY PENDING
              </div>
              <h2 className="text-base font-black tracking-tight">
                입금 안내
              </h2>
            </div>
          </div>
          <PaymentInfoCard info={paymentInfo} />
          <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
            입금 후 운영진이 확인할 때까지 약간의 시간이 걸릴 수 있어요. 화면을
            새로 고치면 최신 상태로 갱신돼요.
          </p>
        </section>
      )}

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

      {!promoteTimeline && (
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
      )}
    </div>
  )
}

function diffDaysKST(today: string, target: string): number {
  const a = Date.UTC(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
    Number(today.slice(8, 10)),
  )
  const b = Date.UTC(
    Number(target.slice(0, 4)),
    Number(target.slice(5, 7)) - 1,
    Number(target.slice(8, 10)),
  )
  return Math.round((b - a) / 86400000)
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

function formatContestDate(value: string | null): string {
  if (!value) return "미정"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`
}
