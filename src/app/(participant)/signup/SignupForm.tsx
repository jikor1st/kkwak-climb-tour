'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type {
  Grade,
  Division,
  DivisionRecommendation,
} from '@/lib/contest/grades'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function formatContestDateShort(value: string | null): string {
  if (!value) return '대회 일정 미정'
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAY_KO[d.getDay()]}) · 강남 6개 암장 볼구력 투어`
}

function softBg(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#F4F4F4'
  return `#${h}1A`
}

export function SignupForm({
  signupNotice,
  contestDate,
  grades,
  divisions,
  recommendations,
}: {
  signupNotice: string
  contestDate: string | null
  grades: Grade[]
  divisions: Division[]
  recommendations: DivisionRecommendation[]
}) {
  const router = useRouter()
  const { data: session, status, update } = useSession()

  useEffect(() => {
    update()
    // 마운트 시 1회만 세션 강제 갱신.
    // [update]를 의존성으로 두면 update reference가 매 갱신마다 바뀌어 무한 루프.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated' && session?.user?.participant) {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const gradeMap = useMemo(
    () => Object.fromEntries(grades.map((g) => [g.id, g])),
    [grades],
  )
  const recsByGrade = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const r of recommendations) {
      const set = m.get(r.challenge_grade) ?? new Set<string>()
      set.add(r.division_id)
      m.set(r.challenge_grade, set)
    }
    return m
  }, [recommendations])

  const [mainGrade, setMainGrade] = useState<string>('')
  const [divisionId, setDivisionId] = useState<string>('')
  const [participantType, setParticipantType] = useState<'crew' | 'guest'>('crew')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const sessionName = (session?.user?.name ?? '').trim()
  const isValid = !!(sessionName && mainGrade && divisionId && agreedToTerms)
  const recommendedSet = mainGrade ? recsByGrade.get(mainGrade) : undefined
  const selectedGrade = mainGrade ? gradeMap[mainGrade] : null
  const selectedDivision = divisionId
    ? divisions.find((d) => d.id === divisionId)
    : null
  const selectedDivisionGrade = selectedDivision
    ? gradeMap[selectedDivision.solve_grade]
    : null

  function handleSubmit(e?: { preventDefault: () => void }) {
    e?.preventDefault()
    if (!isValid) {
      setError('필수 항목을 모두 입력해주세요')
      return
    }
    setError('')
    setConfirming(true)
  }

  async function submitSignup() {
    setConfirming(false)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/participant/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainGrade,
          divisionId,
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
            {formatContestDateShort(contestDate)}
          </p>
        </div>
      </div>

      <form id="signup-form" onSubmit={handleSubmit} className="max-w-xl mx-auto px-5 pt-5 space-y-3">
        {sessionName && (
          <div className="bg-mute/60 border border-line rounded-xl px-4 py-3 text-xs text-ink-700 leading-relaxed">
            <strong className="text-ink-900">{sessionName}</strong> 님으로
            신청합니다. 이름을 바꾸려면 신청 완료 후 내 계정에서 변경하세요.
          </div>
        )}

        {/* 1. 평소 푸는 색 */}
        <Section
          index={1}
          title="평소 푸는 색"
          desc="최근 두 달, 두 곳 이상에서 풀어본 가장 높은 색"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {grades.map((g) => {
              const selected = mainGrade === g.id
              const bg = softBg(g.color_hex)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setMainGrade(g.id)
                    const recs = recsByGrade.get(g.id)
                    if (recs && divisionId && !recs.has(divisionId)) {
                      const firstRec = divisions.find((d) => recs.has(d.id))
                      if (firstRec) setDivisionId(firstRec.id)
                    }
                  }}
                  className="relative flex items-center justify-center gap-2.5 py-5 rounded-xl border-2 font-black text-base transition-all"
                  style={
                    selected
                      ? {
                          color: '#FFFFFF',
                          background: g.color_hex,
                          borderColor: g.color_hex,
                          boxShadow: `0 4px 12px ${g.color_hex}40, 0 8px 24px ${g.color_hex}20`,
                          transform: 'translateY(-1px)',
                        }
                      : {
                          color: g.color_hex,
                          background: bg,
                          borderColor: bg,
                        }
                  }
                >
                  <span
                    className="rounded-full ring-2"
                    style={{
                      background: selected ? '#FFFFFF' : g.color_hex,
                      width: 14,
                      height: 14,
                      boxShadow: selected ? `0 0 0 2px ${g.color_hex}` : 'none',
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

        {/* 3. 부 (참가 카테고리) */}
        <Section
          index={2}
          title="참가 부"
          desc={
            mainGrade
              ? '추천 외에도 자유롭게 고를 수 있어요'
              : '참가하고 싶은 부를 골라주세요'
          }
        >
          <div className="space-y-2.5">
            {divisions.map((d) => {
              const selected = divisionId === d.id
              const isRecommended = recommendedSet?.has(d.id) ?? false
              const grade = gradeMap[d.solve_grade]
              const color = grade?.color_hex ?? '#6B7280'
              const bg = softBg(color)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDivisionId(d.id)}
                  className="relative w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
                  style={
                    selected
                      ? {
                          background: bg,
                          borderColor: color,
                          boxShadow: `0 4px 12px ${color}25`,
                        }
                      : { background: '#FFFFFF', borderColor: '#E7E4DD' }
                  }
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                    style={{
                      background: selected ? color : bg,
                      color: selected ? '#FFFFFF' : color,
                    }}
                  >
                    {d.label[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base" style={{ color: selected ? color : '#0A0A0A' }}>
                        {d.label}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: bg, color }}
                      >
                        {grade?.label ?? d.solve_grade} 풀이
                      </span>
                      {isRecommended && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent text-white tracking-wider">
                          추천
                        </span>
                      )}
                    </div>
                    {d.desc_text && (
                      <div className="text-xs text-ink-500 mt-0.5">{d.desc_text}</div>
                    )}
                  </div>
                  {selected && (
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black"
                      style={{ background: color }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* 4. 참가 유형 */}
        <Section index={3} title="참가 유형">
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
        <Section index={4} title="약관 동의">
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
        {selectedGrade && selectedDivision && selectedDivisionGrade && (
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 sm:p-6">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${selectedGrade.color_hex}80, transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, ${selectedDivisionGrade.color_hex}80, transparent 60%)`,
              }}
            />
            <div className="relative">
              <div className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-black mb-3">
                YOUR ENTRY
              </div>
              <div className="font-black text-lg sm:text-xl leading-snug text-white">
                <span className="text-white">{sessionName || '____'}</span>
                <span className="text-white/70">님은 </span>
                <span style={{ color: selectedDivisionGrade.color_hex }}>
                  {selectedDivision.label}
                </span>
                <span className="text-white/70">에서 </span>
                <span style={{ color: selectedDivisionGrade.color_hex }}>
                  {selectedDivisionGrade.label} 풀이
                </span>
                <span className="text-white/70">로 신청합니다</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 font-bold">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: selectedGrade.color_hex }}
                  />
                  평소 {selectedGrade.label}
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
      <div className="fixed bottom-0 left-0 right-0 bg-paper/75 backdrop-blur-xl backdrop-saturate-150 border-t border-line px-5 py-3.5 safe-bottom">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-xs text-ink-500">
            {!isValid && (
              <>
                <span className="font-bold text-ink-700">남은 항목:</span>{' '}
                {[
                  !sessionName && '이름',
                  !mainGrade && '평소 색',
                  !divisionId && '참가 부',
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

      <ConfirmDialog
        open={confirming}
        title="참가하시겠습니까?"
        confirmLabel="참가 신청"
        cancelLabel="다시 보기"
        message={
          signupNotice.trim() ? (
            <span className="block whitespace-pre-wrap text-sm text-ink-700 leading-relaxed">
              {signupNotice}
            </span>
          ) : (
            <span className="block text-sm text-ink-700">
              위 내용으로 참가 신청을 완료합니다.
            </span>
          )
        }
        onConfirm={submitSignup}
        onCancel={() => setConfirming(false)}
      />
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
