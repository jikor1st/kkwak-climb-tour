import Link from "next/link"
import { requireParticipant } from "@/lib/auth/guards"
import { loadContestData } from "@/lib/contest/load"
import { CATEGORY_META, type Category } from "@/lib/contest/grades"
import { RecordForm } from "./RecordForm"

export const dynamic = "force-dynamic"

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ gym?: string }>
}) {
  const session = await requireParticipant()
  const participant = session.user.participant!
  const contest = await loadContestData(
    participant.id,
    participant.category as Category,
  )
  const meta = CATEGORY_META[participant.category as Category]
  const params = await searchParams

  const initialGymId =
    params.gym && contest.gyms.some((g) => g.id === params.gym)
      ? params.gym
      : contest.gyms[0]?.id ?? null

  const noGyms = contest.gyms.length === 0
  const noWalls = contest.totalCount === 0

  return (
    <RecordForm
      participant={{
        id: participant.id,
        display_name: participant.display_name,
        category: participant.category as Category,
      }}
      meta={meta}
      grade={contest.grade}
      gyms={contest.gyms}
      initialGymId={initialGymId}
      initialTotals={{
        solved: contest.totalSolved,
        total: contest.totalCount,
        rate: contest.completionRate,
      }}
      emptyState={
        noGyms ? (
          <EmptyState
            title="지점이 등록되지 않았어요"
            desc="운영진이 지점을 등록한 뒤 다시 시도해주세요."
          />
        ) : noWalls ? (
          <EmptyState
            title="벽 정보가 아직 없어요"
            desc={`각 지점의 ${meta.solveLabel} 문제 수가 입력되면 여기서 기록할 수 있어요.`}
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
