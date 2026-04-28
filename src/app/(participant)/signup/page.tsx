'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const GRADES = {
  purple: { label: '보라', color: '#9333EA', bg: '#FAF5FF', soft: '#F3E8FF' },
  pink: { label: '핑크', color: '#DB2777', bg: '#FDF2F8', soft: '#FCE7F3' },
  red: { label: '빨강', color: '#DC2626', bg: '#FEF2F2', soft: '#FEE2E2' },
  blue: { label: '파랑', color: '#2563EB', bg: '#EFF6FF', soft: '#DBEAFE' },
} as const

const CATEGORIES = {
  advanced: {
    label: '상급',
    solveColor: '#DC2626',
    solveBg: '#FEF2F2',
    solveLabel: '빨강 풀이',
    desc: '대부분 빨강을 풀 수 있다면',
  },
  intermediate: {
    label: '중급',
    solveColor: '#2563EB',
    solveBg: '#EFF6FF',
    solveLabel: '파랑 풀이',
    desc: '파랑을 안정적으로 푼다면',
  },
  beginner: {
    label: '초급',
    solveColor: '#16A34A',
    solveBg: '#F0FDF4',
    solveLabel: '초록 풀이',
    desc: '초록부터 차근차근',
  },
} as const

type GradeKey = keyof typeof GRADES
type CategoryKey = keyof typeof CATEGORIES

const RECOMMENDED: Record<GradeKey, CategoryKey[]> = {
  purple: ['advanced'],
  pink: ['advanced', 'intermediate'],
  red: ['intermediate', 'beginner'],
  blue: ['beginner'],
}

const RECOMMEND_HINT: Record<GradeKey, string> = {
  purple: '평소 보라를 푸시면 상급(빨강 풀이) 추천.',
  pink: '핑크 → 빨강 절반 이상 풀면 상급, 지점따라 갈리면 중급.',
  red: '빨강 → 안정적이면 중급, 지점 다 돌기 빠듯하면 초급.',
  blue: '평소 파랑을 푸시면 초급(초록 풀이) 추천.',
}

export default function SignupPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()

  useEffect(() => {
    update()
  }, [update])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated' && session?.user?.participant) {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const [displayName, setDisplayName] = useState('')
  const [mainGrade, setMainGrade] = useState<GradeKey | ''>('')
  const [category, setCategory] = useState<CategoryKey | ''>('')
  const [participantType, setParticipantType] = useState<'crew' | 'guest'>('crew')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = !!(displayName.trim() && mainGrade && category && agreedToTerms)
  const recommended = mainGrade ? RECOMMENDED[mainGrade] : []

  async function handleSubmit(e?: { preventDefault: () => void }) {
    e?.preventDefault()
    if (!isValid) {
      setError('필수 항목을 모두 입력해주세요')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/participant/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          mainGrade,
          category,
          participantType,
          agreedToTerms,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '신청 중 오류가 발생했습니다')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-32">
      {/* Hero header */}
      <div className="hero-bg border-b border-line">
        <div className="max-w-xl mx-auto px-5 pt-10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-accent font-bold tracking-wider">꽉크루 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            참가 신청
          </h1>
          <p className="text-ink-700 mt-3 text-sm sm:text-base">
            5월 10일 · 강남 6개 지점 투어
          </p>
        </div>
      </div>

      <form id="signup-form" onSubmit={handleSubmit} className="max-w-xl mx-auto px-5 pt-5 space-y-3">
        {/* 1. 이름 */}
        <Section index={1} title="이름">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3.5 bg-mute border-2 border-line focus:border-accent focus:bg-surface rounded-xl outline-none text-base font-bold transition placeholder:font-normal placeholder:text-ink-300"
            placeholder="이름"
            maxLength={20}
          />
          {displayName && (
            <div className="mt-2 text-xs text-ink-500">
              {displayName.trim().length}/20자
            </div>
          )}
        </Section>

        {/* 2. 평소 푸는 색 */}
        <Section
          index={2}
          title="평소 푸는 색"
          desc="최근 두 달, 두 곳 이상에서 풀어본 가장 높은 색"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {(Object.entries(GRADES) as [GradeKey, typeof GRADES[GradeKey]][]).map(([key, g]) => {
              const selected = mainGrade === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMainGrade(key)}
                  className="relative flex items-center justify-center gap-2.5 py-5 rounded-xl border-2 font-black text-base transition-all"
                  style={
                    selected
                      ? {
                          color: '#FFFFFF',
                          background: g.color,
                          borderColor: g.color,
                          boxShadow: `0 4px 12px ${g.color}40, 0 8px 24px ${g.color}20`,
                          transform: 'translateY(-1px)',
                        }
                      : {
                          color: g.color,
                          background: g.bg,
                          borderColor: g.soft,
                        }
                  }
                >
                  <span
                    className="rounded-full ring-2"
                    style={{
                      background: selected ? '#FFFFFF' : g.color,
                      width: 14,
                      height: 14,
                      boxShadow: selected ? `0 0 0 2px ${g.color}` : 'none',
                    }}
                  />
                  {g.label}
                  {selected && (
                    <span className="absolute top-2 right-2.5 text-[10px] font-black bg-white/25 px-1.5 py-0.5 rounded">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* 3. 카테고리 */}
        <Section
          index={3}
          title="참가 카테고리"
          desc={
            mainGrade
              ? '추천 외에도 자유롭게 고를 수 있어요'
              : '참가하고 싶은 카테고리를 골라주세요'
          }
        >
          <div className="space-y-2.5">
            {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(
              ([key, c]) => {
                const selected = category === key
                const isRecommended = recommended.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className="relative w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
                    style={
                      selected
                        ? {
                            background: c.solveBg,
                            borderColor: c.solveColor,
                            boxShadow: `0 4px 12px ${c.solveColor}25`,
                          }
                        : { background: '#FFFFFF', borderColor: '#E7E4DD' }
                    }
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                      style={{
                        background: selected ? c.solveColor : c.solveBg,
                        color: selected ? '#FFFFFF' : c.solveColor,
                      }}
                    >
                      {c.label[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base" style={{ color: selected ? c.solveColor : '#0A0A0A' }}>
                          {c.label}조
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: c.solveBg, color: c.solveColor }}
                        >
                          {c.solveLabel}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent text-white tracking-wider">
                            추천
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">{c.desc}</div>
                    </div>
                    {selected && (
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{ background: c.solveColor }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                )
              },
            )}
          </div>
          {mainGrade && (
            <p className="mt-3 text-xs text-ink-500 leading-relaxed bg-mute rounded-lg px-3 py-2.5">
              💡 {RECOMMEND_HINT[mainGrade]}
            </p>
          )}
        </Section>

        {/* 4. 참가 유형 */}
        <Section index={4} title="참가 유형">
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { value: 'crew', label: '꽉크루 멤버', sub: '정규 크루' },
                { value: 'guest', label: '게스트', sub: '외부 참가자' },
              ] as const
            ).map((t) => {
              const selected = participantType === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setParticipantType(t.value)}
                  className={`relative py-4 rounded-xl border-2 font-black text-sm transition-all ${
                    selected
                      ? 'bg-accent text-white border-accent shadow-pop -translate-y-0.5'
                      : 'bg-surface text-ink-700 border-line hover:border-line-strong'
                  }`}
                >
                  <div>{t.label}</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${selected ? 'text-white/80' : 'text-ink-500'}`}>
                    {t.sub}
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* 5. 약관 */}
        <Section index={5} title="약관 동의">
          <button
            type="button"
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              agreedToTerms
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <span
              className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition ${
                agreedToTerms ? 'bg-accent border-accent text-white' : 'border-line bg-surface'
              }`}
            >
              {agreedToTerms && <span className="text-xs font-black">✓</span>}
            </span>
            <div className="text-sm flex-1">
              <p className="font-black text-ink-900 mb-1.5">참가 약관에 동의합니다</p>
              <ul className="space-y-0.5 text-ink-500 text-xs leading-relaxed">
                <li>· 정해진 색만 풀기 (다른 색 풀면 실격)</li>
                <li>· 양심적으로 기록하기</li>
                <li>· 즐겁게 참여하기</li>
              </ul>
            </div>
          </button>
        </Section>

        {/* 라이브 미리보기 */}
        {mainGrade && category && (
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 sm:p-6">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${GRADES[mainGrade].color}80, transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, ${CATEGORIES[category].solveColor}80, transparent 60%)`,
              }}
            />
            <div className="relative">
              <div className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-black mb-3">
                YOUR ENTRY
              </div>
              <div className="font-black text-lg sm:text-xl leading-snug text-white">
                <span className="text-white">{displayName.trim() || '____'}</span>
                <span className="text-white/70">님은 </span>
                <span style={{ color: CATEGORIES[category].solveColor }}>
                  {CATEGORIES[category].label}조
                </span>
                <span className="text-white/70">에서 </span>
                <span style={{ color: CATEGORIES[category].solveColor }}>
                  {CATEGORIES[category].solveLabel}
                </span>
                <span className="text-white/70">로 신청합니다</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 font-bold">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: GRADES[mainGrade].color }}
                  />
                  평소 {GRADES[mainGrade].label}
                </span>
                <span className="text-white/40">→</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 font-bold">
                  {participantType === 'crew' ? '꽉크루' : '게스트'}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-accent-soft text-accent border-2 border-accent/30 px-4 py-3 rounded-xl text-sm font-bold">
            ⚠️ {error}
          </div>
        )}
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur border-t border-line px-5 py-3.5 safe-bottom">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-xs text-ink-500">
            {!isValid && (
              <>
                <span className="font-bold text-ink-700">남은 항목:</span>{' '}
                {[
                  !displayName.trim() && '이름',
                  !mainGrade && '평소 색',
                  !category && '카테고리',
                  !agreedToTerms && '약관',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </>
            )}
            {isValid && <span className="text-accent font-black">✓ 모든 항목 완료</span>}
          </div>
          <button
            type="submit"
            form="signup-form"
            disabled={loading || !isValid}
            className="px-6 py-4 bg-accent hover:bg-accent/90 disabled:bg-ink-300 disabled:cursor-not-allowed transition rounded-xl font-black text-white text-base shadow-pop disabled:shadow-none whitespace-nowrap"
          >
            {loading ? '신청 중...' : '신청 완료 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  index,
  title,
  desc,
  children,
}: {
  index: number
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-soft">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-xs font-black shadow-sm">
          {index}
        </span>
        <h2 className="text-base sm:text-lg font-black">{title}</h2>
      </div>
      {desc && <p className="text-xs text-ink-500 mb-3 ml-9.5">{desc}</p>}
      <div className={desc ? 'mt-3' : 'mt-4'}>{children}</div>
    </div>
  )
}
