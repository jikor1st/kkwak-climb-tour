import Link from 'next/link'
import { auth } from '@/lib/auth/auth'

export const dynamic = 'force-dynamic'

const GRADES = {
  purple: { label: '보라', color: '#9333EA', bg: '#FAF5FF' },
  pink: { label: '핑크', color: '#DB2777', bg: '#FDF2F8' },
  red: { label: '빨강', color: '#DC2626', bg: '#FEF2F2' },
  blue: { label: '파랑', color: '#2563EB', bg: '#EFF6FF' },
  green: { label: '초록', color: '#16A34A', bg: '#F0FDF4' },
} as const

type GradeKey = keyof typeof GRADES

function GradePill({ grade, override }: { grade: GradeKey; override?: string }) {
  const g = GRADES[grade]
  return (
    <span
      className="grade-pill"
      style={{ color: g.color, borderColor: g.color, background: g.bg }}
    >
      <span className="grade-dot" style={{ background: g.color }} />
      {override ?? g.label}
    </span>
  )
}

const LEVEL_MAP: { from: GradeKey; to: GradeKey; level: string }[] = [
  { from: 'purple', to: 'red', level: '상급' },
  { from: 'pink', to: 'red', level: '상급' },
  { from: 'pink', to: 'blue', level: '중급' },
  { from: 'red', to: 'blue', level: '중급' },
  { from: 'red', to: 'green', level: '초급' },
]

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

  const primaryCta = hasParticipant
    ? { href: '/dashboard', label: '내 대시보드로' }
    : isLoggedIn
    ? { href: '/signup', label: '참가 신청 마저 하기' }
    : { href: '/signup', label: '참가 신청하기' }

  const bottomCta = hasParticipant
    ? { href: '/dashboard', label: '내 대시보드로 →' }
    : { href: '/signup', label: '지금 참가 신청하기 →' }

  const bottomCopy = hasParticipant
    ? '신청 완료. 5월 10일에 만나요.'
    : '5월 10일, 꽉크루 강남 투어에서 만나요.'

  return (
    <div className="min-h-screen">
      {showForbidden && (
        <div className="bg-accent text-white text-center text-sm font-bold py-2.5 px-4">
          접근 권한이 없는 페이지입니다.
        </div>
      )}
      {isAdmin && (
        <Link
          href="/admin"
          className="fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-900 text-white text-xs font-black shadow-pop hover:bg-accent transition"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          운영자 콘솔 →
        </Link>
      )}
      {/* Hero */}
      <section className="hero-bg px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-accent font-bold tracking-wider">2026.05.10 SAT</span>
          </div>

          <h1 className="text-[40px] leading-[1.1] sm:text-6xl sm:leading-[1.05] font-black tracking-tight">
            강남 6개 지점,<br/>
            <span className="text-accent">하루 안에</span> 정주행.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-xl">
            평소 실력보다 살짝 쉬운 색을 정한 시간 안에 누가 더 많이 풀 수 있을까?
          </p>

          <div className="mt-8">
            <div className="text-xs text-ink-500 mb-3 font-bold tracking-wider">VENUES</div>
            <div className="flex flex-wrap gap-2">
              {['신사', '논현', '강남', '양재', '사당', '이수'].map((venue) => (
                <span key={venue} className="px-3.5 py-2 rounded-lg bg-surface border border-line text-sm font-bold shadow-soft">
                  {venue}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href={primaryCta.href} className="px-7 py-4 bg-accent hover:bg-accent/90 transition rounded-xl font-bold text-white text-base shadow-pop text-center">
              {primaryCta.label}
            </Link>
            <a href="#rules" className="px-7 py-4 bg-surface border border-line hover:border-line-strong transition rounded-xl font-bold text-ink-900 text-base text-center">
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
              평소 푸는 색보다 <span className="text-accent">살짝 쉬운 색</span>을<br/>
              정해진 시간 안에 <span className="text-accent">누가 더 많이</span> 푸느냐
            </p>
          </div>

          <div className="space-y-4">
            {[
              ['6개 지점을 다 같이', '한 곳씩 차례로 돕니다.'],
              ['정해진 색', '을 풀어 갯수를 기록합니다.'],
              ['완등 비율', '이 가장 높은 사람이 카테고리별로 1등.'],
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
            { label: '일시', big: '5월 10일', sub: '토 09:30~16:50' },
            { label: '참가비', big: '10,000원', sub: '크루·게스트 동일', num: true },
            { label: '시상', big: '2명', sub: '상급 1, 중·초급 1' },
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
                <strong className="text-ink-900">일일권은 하루에 한 지점만</strong> 이용 가능해서 6개 지점을 다 도는 이 대회는 참가가 불가능해요. 신청 전에 본인 이용권을 꼭 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 매핑 표 */}
      <div id="rules" className="max-w-3xl mx-auto px-5 py-12 sm:py-14">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">FIND YOUR LEVEL</div>
        <h2 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">나는 어디로?</h2>
        <p className="text-ink-700 mb-7 text-base">평소 본인이 푸는 색을 기준으로 카테고리가 정해져요.</p>

        <div className="bg-surface border border-line rounded-3xl p-3 sm:p-5 shadow-card">
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 sm:gap-4 px-3 pb-3 mb-1 border-b border-line text-[11px] sm:text-xs text-ink-500 font-bold tracking-wider">
            <div>평소 푸는 색</div>
            <div />
            <div>대회에서 풀 색</div>
            <div className="text-right">조</div>
          </div>

          {LEVEL_MAP.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:gap-4 px-3 py-3.5 sm:py-4 rounded-xl hover:bg-mute transition"
            >
              <div><GradePill grade={row.from} /></div>
              <div className="text-ink-300 font-bold">→</div>
              <div><GradePill grade={row.to} /></div>
              <div className="text-right text-sm font-black">{row.level}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-500 mt-3 px-1">예: 평소 보라를 푸시면 → 대회에서는 빨강을 풀게 됩니다 (상급조)</p>

        {/* 시상 구조 */}
        <div className="mt-5 bg-surface border border-line rounded-2xl p-5 shadow-soft">
          <div className="text-xs text-accent uppercase tracking-wider mb-3 font-black">PRIZES</div>
          <div className="font-black text-base mb-3">시상은 이렇게 나뉘어요</div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3.5 bg-mute rounded-xl">
              <GradePill grade="red" override="상급" />
              <div className="flex-1">
                <div className="font-black text-sm">상급조 1등 · 1명</div>
                <div className="text-xs text-ink-700 mt-0.5">빨강 풀이 비율 1위</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-mute rounded-xl">
              <div className="flex flex-col gap-1 shrink-0">
                <GradePill grade="blue" override="중급" />
                <GradePill grade="green" override="초급" />
              </div>
              <div className="flex-1">
                <div className="font-black text-sm">중급·초급 통합 1등 · 1명</div>
                <div className="text-xs text-ink-700 mt-0.5">두 카테고리 합쳐 비율 1위</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-500 mt-3 leading-relaxed">
            채점은 <strong className="text-ink-700">완등 비율(푼 갯수 / 전체 갯수)</strong>로 하기 때문에 중급·초급을 합쳐도 공정하게 비교돼요.
          </p>
        </div>

        {/* 카테고리 가이드 */}
        <div className="mt-6 bg-surface border border-line rounded-2xl p-5 shadow-soft">
          <div className="font-black text-base mb-3">카테고리는 본인 양심껏 선택해주세요</div>
          <p className="text-sm text-ink-700 leading-relaxed mb-4">
            같은 색을 평소에 푼다고 해도 사람마다 체감 난이도가 다를 수 있어요. 더 쉬운 카테고리를 선택해서 비율로 유리해지는 걸 막기 위해 본인의 진짜 실력에 맞춰 정직하게 선택해주세요.
          </p>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex gap-2">
              <span className="font-black shrink-0" style={{ color: '#DC2626' }}>상급 (빨강 풀이)</span>
              <span className="text-ink-700">빨강이 평소 무난하다면</span>
            </div>
            <div className="flex gap-2">
              <span className="font-black shrink-0" style={{ color: '#2563EB' }}>중급 (파랑 풀이)</span>
              <span className="text-ink-700">파랑이 평소 무난하다면</span>
            </div>
            <div className="flex gap-2">
              <span className="font-black shrink-0" style={{ color: '#16A34A' }}>초급 (초록 풀이)</span>
              <span className="text-ink-700">파랑도 6개 지점 다 돌기 힘들 것 같다면</span>
            </div>
          </div>
        </div>

        {/* 핑크 가이드 */}
        <div className="mt-6 bg-surface border-2 rounded-2xl p-5 shadow-soft" style={{ borderColor: '#DB2777' }}>
          <div className="flex items-center gap-2 mb-3">
            <GradePill grade="pink" />
            <span className="font-black text-sm">평소 핑크를 푸시는 분들께</span>
          </div>
          <p className="text-sm text-ink-700 mb-4">상급 / 중급 둘 중 하나를 직접 고를 수 있어요.</p>
          <div className="space-y-2.5">
            <div className="bg-mute rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grade-dot" style={{ background: '#DC2626' }} />
                <span className="font-black text-sm" style={{ color: '#DC2626' }}>상급으로 가세요 (빨강 풀이)</span>
              </div>
              <p className="text-sm text-ink-700">여러 지점에서 빨강을 한 세션에 <strong className="text-ink-900">절반 이상</strong> 풀 수 있다면.</p>
            </div>
            <div className="bg-mute rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grade-dot" style={{ background: '#2563EB' }} />
                <span className="font-black text-sm" style={{ color: '#2563EB' }}>중급으로 가세요 (파랑 풀이)</span>
              </div>
              <p className="text-sm text-ink-700">빨강이 <strong className="text-ink-900">지점 따라 갈리면</strong>. 어떤 곳은 풀고, 어떤 곳은 못 풀고.</p>
            </div>
          </div>
        </div>

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
          <div className="mt-6 pt-6 border-t border-line text-center text-sm text-ink-700">
            <strong className="text-ink-900">상급 1등</strong> · <strong className="text-ink-900">중급·초급 통합 1등</strong> 시상 · 동률은 공동 1등
          </div>
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
