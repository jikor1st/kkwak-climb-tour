import Link from "next/link"
import { requireAuth } from "@/lib/auth/guards"
import {
  loadRankings,
  type RankingRow,
  type RankingGroupView,
} from "@/lib/contest/ranking"

export const dynamic = "force-dynamic"

export default async function RankingPage() {
  const session = await requireAuth()
  const myParticipantId = session.user.participant?.id ?? null
  const data = await loadRankings()

  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-20">
      <div className="mb-6">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-1.5">
          LEADERBOARD · 전체 순위
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          전체 순위
        </h1>
        <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
          완등 비율(%)이 같으면 풀이 갯수가 많은 사람이 위. 같으면 공동 순위.
        </p>
      </div>

      {data.resultsLocked ? (
        <div className="bg-surface border border-line rounded-3xl p-8 text-center shadow-soft">
          <div className="text-3xl mb-3">🔒</div>
          <div className="font-black text-lg mb-2">결과는 대회 종료 후 공개</div>
          <p className="text-sm text-ink-700">
            운영자가 결과 공개를 잠가둔 상태입니다.
          </p>
        </div>
      ) : (
        <>
          {data.groups.map((group) => (
            <RankingSection
              key={group.id}
              group={group}
              myParticipantId={myParticipantId}
            />
          ))}
          {data.ungrouped && (
            <RankingSection
              group={data.ungrouped}
              myParticipantId={myParticipantId}
            />
          )}
          {data.groups.length === 0 && !data.ungrouped && (
            <div className="bg-surface border border-line rounded-3xl p-8 text-center shadow-soft">
              <p className="text-sm text-ink-700">
                아직 랭킹 그룹이 없어요. 어드민에서 그룹과 부를 등록해주세요.
              </p>
            </div>
          )}
        </>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/dashboard"
          className="inline-block text-xs text-ink-500 hover:text-ink-900 transition font-bold"
        >
          ← 내 대시보드로
        </Link>
      </div>
    </div>
  )
}

function RankingSection({
  group,
  myParticipantId,
}: {
  group: RankingGroupView
  myParticipantId: string | null
}) {
  const divisionLabels = group.divisions.map((d) => d.label).join(" · ")
  const accent = group.divisions[0]?.color ?? "#0a0a0a"
  const showDivisionTag = group.divisions.length > 1
  return (
    <section className="bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-soft mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-black">{group.name}</h2>
        <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider">
          {group.rows.length}명
        </span>
      </div>
      <p className="text-xs text-ink-500 mb-4">
        {divisionLabels || "참여 부 없음"} · 풀이율 합산 랭킹
      </p>

      {group.rows.length === 0 ? (
        <div className="bg-mute rounded-xl p-5 text-sm text-ink-700 text-center">
          참가자가 없어요.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {group.rows.map((row) => (
            <RankingItem
              key={row.participantId}
              row={row}
              isMine={row.participantId === myParticipantId}
              accent={accent}
              showDivision={showDivisionTag}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function RankingItem({
  row,
  isMine,
  accent,
  showDivision,
}: {
  row: RankingRow
  isMine: boolean
  accent: string
  showDivision: boolean
}) {
  const isTop = row.rank === 1
  return (
    <li
      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
        isMine
          ? "bg-accent-soft border-accent/30"
          : isTop
            ? "bg-surface border-accent/40 shadow-soft"
            : "bg-surface border-line"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 num ${
          isTop ? "bg-accent text-white shadow-pop" : "bg-mute text-ink-700"
        }`}
        style={isTop ? { background: accent, color: "#fff" } : undefined}
      >
        {row.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black truncate">{row.displayName}</span>
          {isMine && (
            <span className="text-[9px] font-black text-accent uppercase tracking-wider">
              · 나
            </span>
          )}
          {showDivision && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ color: row.divisionColor, background: row.divisionBg }}
            >
              {row.divisionLabel}
            </span>
          )}
          {row.participantType === "guest" && (
            <span className="text-[9px] font-black text-ink-500 tracking-wider">
              · 게스트
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-500 mt-0.5 num">
          {row.solved} / {row.total} 완등
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-lg font-black num ${isTop ? "text-accent" : ""}`}>
          {row.rate}%
        </div>
      </div>
    </li>
  )
}
