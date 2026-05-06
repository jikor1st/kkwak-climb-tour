import Link from "next/link"
import { requireParticipant } from "@/lib/auth/guards"
import { loadContestData, buildPaymentInfo } from "@/lib/contest/load"
import { isContestOpen } from "@/lib/contest/timeline-now"
import { buildTimeline } from "@/lib/contest/schedule"
import { RecordForm } from "./RecordForm"

export const dynamic = "force-dynamic"

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ gym?: string }>
}) {
  const session = await requireParticipant()
  const participant = session.user.participant!
  const contest = await loadContestData(participant.id, participant.division_id)
  const division = contest.division
  const params = await searchParams

  const initialGymId =
    params.gym && contest.gyms.some((g) => g.id === params.gym)
      ? params.gym
      : contest.gyms[0]?.id ?? null

  const noGyms = contest.gyms.length === 0
  const noWalls = contest.totalCount === 0
  const timeline = buildTimeline(
    {
      start_time: contest.settings.start_time,
      default_gym_minutes: contest.settings.default_gym_minutes,
      lunch_minutes: contest.settings.lunch_minutes,
      lunch_start_time: contest.settings.lunch_start_time,
      contest_date: contest.settings.contest_date,
    },
    contest.gyms,
    contest.breaks,
  )
  const window = isContestOpen(
    {
      contest_date: contest.settings.contest_date,
      start_time: contest.settings.start_time,
    },
    timeline.endLabel,
  )

  const lockReason = !participant.paid
    ? {
        kind: "unpaid" as const,
        title: "입금 확인 후 기록할 수 있어요",
        desc: "운영자가 입금을 확인하면 자동으로 풀리며, 그때부터 기록할 수 있어요.",
      }
    : !window.open
      ? {
          kind: "closed" as const,
          title: "지금은 기록할 수 없어요",
          desc: window.reason ?? "대회 시간이 아닙니다.",
        }
      : null

  return (
    <RecordForm
      participant={{
        id: participant.id,
        display_name: participant.display_name,
        paid: participant.paid,
      }}
      division={division}
      grade={contest.grade}
      gyms={contest.gyms}
      initialGymId={initialGymId}
      initialTotals={{
        solved: contest.totalSolved,
        total: contest.totalCount,
        rate: contest.completionRate,
      }}
      lockReason={lockReason}
      paymentInfo={buildPaymentInfo(contest.settings)}
      emptyState={
        noGyms ? (
          <EmptyState
            title="지점이 등록되지 않았어요"
            desc="운영진이 지점을 등록한 뒤 다시 시도해주세요."
          />
        ) : noWalls ? (
          <EmptyState
            title="벽 정보가 아직 없어요"
            desc={`각 지점의 ${division.solve_grade_label} 풀이 문제 수가 입력되면 여기서 기록할 수 있어요.`}
          />
        ) : null
      }
    />
  )
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-10">
      <div className="bg-surface border border-line rounded-3xl p-8 sm:p-10 text-center shadow-soft">
        <div className="text-4xl mb-3">🧗‍♂️</div>
        <h1 className="text-xl font-black mb-2">{title}</h1>
        <p className="text-sm text-ink-700 mb-6">{desc}</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-mute hover:bg-line transition rounded-xl font-bold text-ink-900 text-sm"
        >
          ← 대시보드로
        </Link>
      </div>
    </div>
  )
}
