import Link from 'next/link'
import { auth } from '@/lib/auth/auth'
import { createServerClient } from '@/lib/supabase/server'
import { buildTimeline } from '@/lib/contest/schedule'
import { CurrentScheduleStatus } from '@/components/CurrentScheduleStatus'
import { loadDifficultySystem, type Grade, type Division } from '@/lib/contest/grades'

export const dynamic = 'force-dynamic'

function softBg(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#F4F4F4'
  return `#${h}1A`
}

function GradePill({ grade }: { grade: Grade }) {
  const bg = softBg(grade.color_hex)
  return (
    <span
      className="grade-pill"
      style={{ color: grade.color_hex, borderColor: grade.color_hex, background: bg }}
    >
      <span className="grade-dot" style={{ background: grade.color_hex }} />
      {grade.label}
    </span>
  )
}

function DivisionPill({
  division,
  grade,
}: {
  division: Division
  grade: Grade | undefined
}) {
  const color = grade?.color_hex ?? '#6B7280'
  return (
    <span
      className="grade-pill"
      style={{ color, borderColor: color, background: softBg(color) }}
    >
      <span className="grade-dot" style={{ background: color }} />
      {division.label}
    </span>
  )
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  const hasParticipant = !!session?.user?.participant
  const isLoggedIn = !!session?.user
  const isAdmin = session?.user?.role === 'admin'
  const { error } = await searchParams
  const showForbidden = error === 'forbidden'

  const supabase = createServerClient()
  const [csRes, partsCountRes, paidCountRes, gymsRes, durRes, breaksRes, system] =
    await Promise.all([
      supabase
        .from('contest_settings')
        .select(
          'contest_date, start_time, default_gym_minutes, lunch_minutes, lunch_start_time, entry_fee',
        )
        .eq('id', 1)
        .maybeSingle(),
      supabase
        .from('participants')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('paid', true),
      supabase
        .from('gyms')
        .select('id, name, display_order')
        .eq('active', true)
        .order('display_order'),
      supabase.from('gym_durations').select('gym_id, duration_minutes'),
      supabase
        .from('schedule_breaks')
        .select('id, name, duration_minutes, after_gym_id, display_order')
        .order('display_order'),
      loadDifficultySystem(),
    ])

  const cs = csRes.data
  const contestDate = cs?.contest_date ?? null
  const participantCount = partsCountRes.count ?? 0
  const paidCount = paidCountRes.count ?? 0
  const entryFee = cs?.entry_fee ?? 10000

  const defaultMinutes = cs?.default_gym_minutes ?? 45
  const durMap = new Map(
    (durRes.data ?? []).map((d) => [d.gym_id, d.duration_minutes]),
  )
  const timelineGyms = (gymsRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    display_order: g.display_order,
    duration_minutes: durMap.get(g.id) ?? defaultMinutes,
  }))
  const breaks = (breaksRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    duration_minutes: b.duration_minutes,
    after_gym_id: b.after_gym_id ?? null,
    display_order: b.display_order ?? 0,
  }))
  const timeline = buildTimeline(
    {
      start_time: cs?.start_time ?? null,
      default_gym_minutes: defaultMinutes,
      lunch_minutes: cs?.lunch_minutes ?? 60,
      lunch_start_time: cs?.lunch_start_time ?? null,
      contest_date: contestDate,
    },
    timelineGyms,
    breaks,
  )
  const startLabel = timeline.startLabel
  const endLabel = timeline.endLabel
  const dateBadge = formatDateBadge(contestDate)
  const dateBig = formatDateBig(contestDate)
  const dateSub =
    startLabel && endLabel
      ? `${formatWeekday(contestDate)} ${startLabel}~${endLabel}`
      : formatWeekday(contestDate)

  const sortedGrades = [...system.grades].sort((a, b) => a.sort_order - b.sort_order)
  const sortedDivisions = system.divisions
    .filter((d) => d.active)
    .sort((a, b) => a.sort_order - b.sort_order)
  const sortedGroups = [...system.rankingGroups].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  // 도전 색 → 추천 부 매핑
  const recsByGrade = new Map<string, string[]>()
  for (const r of system.recommendations) {
    const arr = recsByGrade.get(r.challenge_grade) ?? []
    arr.push(r.division_id)
    recsByGrade.set(r.challenge_grade, arr)
  }

  const primaryCta = hasParticipant
    ? { href: '/dashboard', label: '내 대시보드로' }
    : isLoggedIn
      ? { href: '/signup', label: '참가 신청 마저 하기' }
      : { href: '/signup', label: '참가 신청하기' }

  const bottomCta = hasParticipant
    ? { href: '/dashboard', label: '내 대시보드로 →' }
    : { href: '/signup', label: '지금 참가 신청하기 →' }

  const bottomCopy = hasParticipant
    ? contestDate
      ? `신청 완료. ${dateBig}에 만나요.`
      : '신청 완료. 대회 날 만나요.'
    : contestDate
      ? `${dateBig}, 꽉크루 강남 투어에서 만나요.`
      : '꽉크루 강남 투어에서 만나요.'

  // 시상 요약: 그룹별 1등
  const prizeCount = sortedGroups.length

  return (
    <div className="min-h-screen">
      {showForbidden && (
        <div className="bg-accent text-white text-center text-sm font-bold py-2.5 px-4">
          접근 권한이 없는 페이지입니다.
        </div>
      )}
      {isLoggedIn && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-900 text-white text-xs font-black shadow-pop hover:bg-accent transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              운영자 콘솔
            </Link>
          )}
          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-line text-xs font-black text-ink-700 hover:border-ink-900 transition shadow-soft"
          >
            내 계정
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="hero-bg px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft/70 backdrop-blur-md backdrop-saturate-150 border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-accent font-bold tracking-wider">{dateBadge}</span>
            </div>
            {participantCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/70 backdrop-blur-md backdrop-saturate-150 border border-line">
                <span className="w-1.5 h-1.5 rounded-full bg-grade-green" />
                <span className="text-xs font-bold text-ink-700 tracking-wider">
                  현재 <strong className="text-ink-900 num">{participantCount}</strong>명 신청
                  {paidCount > 0 && (
                    <span className="text-ink-500 num"> · 입금 {paidCount}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-[56px] leading-none sm:text-[88px] sm:leading-[0.95] font-black tracking-tight">
            볼구력 <span className="text-accent">대회</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-xl font-bold">
            강남 6개 암장 · 하루.
          </p>

          <div className="mt-8">
            <div className="text-xs text-ink-500 mb-3 font-bold tracking-wider">VENUES</div>
            <div className="flex flex-wrap gap-2">
              {(timelineGyms.length > 0
                ? timelineGyms.map((g) => g.name)
                : ['신사', '논현', '강남', '양재', '사당', '이수']
              ).map((venue) => (
                <span key={venue} className="px-3.5 py-2 rounded-lg bg-surface/70 backdrop-blur-md backdrop-saturate-150 border border-line text-sm font-bold shadow-soft">
                  {venue}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <CurrentScheduleStatus
              timeline={timeline}
              contestDate={contestDate}
            />
          </div>

          <div className="mt-2 flex flex-col sm:flex-row gap-3">
            <Link href={primaryCta.href} className="px-7 py-4 bg-accent hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(220,38,38,0.28)] active:translate-y-0 transition-all rounded-xl font-bold text-white text-base shadow-pop text-center">
              {primaryCta.label}
            </Link>
            <a href="#rules" className="px-7 py-4 bg-surface border border-line hover:border-line-strong hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl font-bold text-ink-900 text-base text-center">
              규칙 보기
            </a>
          </div>
          {hasParticipant && (
            <p className="mt-4 text-sm text-ink-500">
              이미 신청을 완료했어요. 같은 카카오 계정으로 다시 신청할 수 없어요.
            </p>
          )}
        </div>
      </section>

      {/* 한 줄 룰 */}
      <div className="max-w-3xl mx-auto px-5 py-12 sm:py-14">
        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">REGULATION</div>
          <h2 className="text-2xl sm:text-3xl font-black mb-7 leading-tight">대회 룰, 한 줄.</h2>

          <div className="bg-mute rounded-2xl p-5 sm:p-6 mb-6">
            <p className="text-base sm:text-lg font-bold text-ink-900 leading-relaxed">
              본인 부의 색을 정해진 시간 안에<br />
              <span className="text-accent">가장 많이 풀어낸 사람</span>이 우승.
            </p>
          </div>

          <div className="space-y-4">
            {[
              ['6개 암장을 다 같이', '한 곳씩 차례로 돕니다.'],
              ['본인 부의 색만', '풀어 갯수를 기록합니다.'],
              ['완등 비율', '이 가장 높은 사람이 그룹별로 1등.'],
            ].map(([strong, rest], i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-ink-900 text-white font-black flex items-center justify-center text-xs">{i + 1}</div>
                <p className="text-sm sm:text-base text-ink-700 leading-relaxed pt-0.5">
                  <strong className="text-ink-900">{strong}</strong>{rest}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 핵심 정보 */}
      <div className="max-w-3xl mx-auto px-5 pb-12 sm:pb-14">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '일시', big: dateBig, sub: dateSub },
            {
              label: '참가비',
              big: `${entryFee.toLocaleString()}원`,
              sub: '크루·게스트 동일',
              num: true,
            },
            {
              label: '시상',
              big: prizeCount > 0 ? `${prizeCount}그룹` : '미정',
              sub: prizeCount > 0 ? `각 그룹 1등` : '운영진이 곧 발표',
            },
            { label: '채점', big: '완등 비율', sub: '양심 기록' },
          ].map((it) => (
            <div key={it.label} className="bg-surface border border-line rounded-2xl p-5 shadow-soft">
              <div className="text-xs text-ink-500 uppercase tracking-wider mb-2 font-bold">{it.label}</div>
              <div className={`text-xl font-black ${it.num ? 'num' : ''}`}>{it.big}</div>
              <div className="text-sm text-ink-700 mt-1">{it.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-surface border-2 border-accent rounded-2xl p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-base font-black">!</div>
            <div className="flex-1">
              <div className="text-xs text-accent uppercase tracking-wider mb-1.5 font-black">필독 · 참가 자격</div>
              <div className="font-black text-base sm:text-lg mb-2 leading-tight">
                <span className="text-accent">횟수권 / 개월권</span> 보유자만 참가할 수 있어요
              </div>
              <p className="text-sm text-ink-700 leading-relaxed">
                <strong className="text-ink-900">일일권은 하루에 한 암장만</strong> 이용 가능해서 6개 암장을 다 도는 이 대회는 참가가 불가능해요. 신청 전에 본인 이용권을 꼭 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 어디로? - 부 안내 */}
      <div id="rules" className="max-w-3xl mx-auto px-5 py-12 sm:py-14">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">FIND YOUR DIVISION</div>
        <h2 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">나는 어느 부?</h2>
        <p className="text-ink-700 mb-7 text-base">
          평소 푸는 색을 기준으로 추천 부가 표시돼요. 추천 외에도 자유롭게 선택할 수 있어요.
        </p>

        {sortedDivisions.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-8 text-center text-sm text-ink-500 shadow-card">
            아직 부가 등록되지 않았어요. 운영진이 곧 등록할 예정이에요.
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-3xl p-3 sm:p-5 shadow-card">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 px-3 pb-3 mb-1 border-b border-line text-[11px] sm:text-xs text-ink-500 font-bold tracking-wider">
              <div>평소 푸는 색</div>
              <div />
              <div>추천 부</div>
            </div>

            {sortedGrades.map((grade) => {
              const recIds = recsByGrade.get(grade.id) ?? []
              const recDivisions = recIds
                .map((id) => sortedDivisions.find((d) => d.id === id))
                .filter((d): d is Division => !!d)
              if (recDivisions.length === 0) return null
              return (
                <div
                  key={grade.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 px-3 py-3.5 sm:py-4 rounded-xl hover:bg-mute transition"
                >
                  <div>
                    <GradePill grade={grade} />
                  </div>
                  <div className="text-ink-300 font-bold">→</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recDivisions.map((d) => (
                      <DivisionPill
                        key={d.id}
                        division={d}
                        grade={system.gradesById[d.solve_grade]}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 시상 구조 */}
        {sortedGroups.length > 0 && (
          <div className="mt-5 bg-surface border border-line rounded-2xl p-5 shadow-soft">
            <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">PRIZES</div>
            <div className="font-black text-base mb-3">시상은 이렇게 나뉘어요</div>
            <div className="space-y-2.5">
              {sortedGroups.map((g) => {
                const groupDivisions = sortedDivisions.filter(
                  (d) => d.ranking_group_id === g.id,
                )
                if (groupDivisions.length === 0) return null
                return (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 p-3.5 bg-mute rounded-xl"
                  >
                    <div className="flex flex-col gap-1 shrink-0">
                      {groupDivisions.map((d) => (
                        <DivisionPill
                          key={d.id}
                          division={d}
                          grade={system.gradesById[d.solve_grade]}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm">{g.name} 1등 · 1명</div>
                      <div className="text-xs text-ink-700 mt-0.5">
                        포함 부 풀이율 1위
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-ink-500 mt-3 leading-relaxed">
              채점은{' '}
              <strong className="text-ink-700">완등 비율(푼 갯수 / 전체 갯수)</strong>로
              하기 때문에 같은 그룹에 다른 색 부가 묶여 있어도 공정하게 비교돼요.
            </p>
          </div>
        )}

        {/* 평소 푸는 색 정의 */}
        <div className="mt-5 bg-mute rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-ink-900 text-white flex items-center justify-center text-sm font-black">?</div>
            <div>
              <div className="font-black mb-2 text-base">&ldquo;평소 푸는 색&rdquo; 어떻게 정해요?</div>
              <p className="text-sm sm:text-base text-ink-700 leading-relaxed">
                <strong className="text-ink-900">최근 두 달, 두 군데 이상 지점</strong>에서 풀어본 적 있는 가장 높은 색이에요.
              </p>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">
                지점마다 난이도가 좀 달라서, 한 지점에서 운으로 한두 번 푼 건 빼고 봐요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 채점 */}
      <div className="max-w-3xl mx-auto px-5 py-12 sm:py-14">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">SCORING</div>
        <h2 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">완등 비율로 채점</h2>
        <p className="text-ink-700 mb-7">시간 안에 더 많이 푼 사람이 이깁니다.</p>

        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-[10px] sm:text-xs text-ink-500 uppercase tracking-wider mb-2 font-bold leading-tight">푼 갯수</div>
              <div className="text-3xl sm:text-5xl font-black text-accent num">27</div>
            </div>
            <div className="flex items-center justify-center pt-6">
              <span className="text-2xl sm:text-4xl text-ink-300 font-light">/</span>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-ink-500 uppercase tracking-wider mb-2 font-bold leading-tight">전체 갯수</div>
              <div className="text-3xl sm:text-5xl font-black num">90</div>
            </div>
          </div>
          <div className="my-6 h-px bg-line" />
          <div className="text-center">
            <div className="text-xs text-ink-500 uppercase tracking-wider mb-2 font-bold">최종 점수</div>
            <div className="text-5xl sm:text-7xl font-black text-accent num">30%</div>
          </div>
          {sortedGroups.length > 0 && (
            <div className="mt-6 pt-6 border-t border-line text-center text-sm text-ink-700">
              {sortedGroups.map((g) => (
                <span key={g.id}>
                  <strong className="text-ink-900">{g.name} 1등</strong>
                  {' · '}
                </span>
              ))}
              시상 · 동률은 공동 1등
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="bg-ink-900 px-5 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            {hasParticipant ? '신청 완료되셨어요!' : '준비되셨나요?'}
          </h2>
          <p className="text-ink-300 text-base sm:text-lg mb-8">{bottomCopy}</p>
          <Link href={bottomCta.href} className="inline-block px-8 py-4 bg-accent hover:bg-accent/90 transition rounded-xl font-bold text-white text-base shadow-pop">
            {bottomCta.label}
          </Link>
        </div>
      </section>
    </div>
  )
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDateBadge(value: string | null): string {
  const d = parseDate(value)
  if (!d) return '일정 미정'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${WEEKDAY_EN[d.getDay()]}`
}

function formatDateBig(value: string | null): string {
  const d = parseDate(value)
  if (!d) return '미정'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatWeekday(value: string | null): string {
  const d = parseDate(value)
  return d ? WEEKDAY_KO[d.getDay()] : ''
}
