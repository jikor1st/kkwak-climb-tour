import { auth } from '@/lib/auth/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { mainGrade, divisionId, participantType, agreedToTerms } = body

    if (!mainGrade || !divisionId || !participantType) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: '약관에 동의해주세요' },
        { status: 400 }
      )
    }

    if (participantType !== 'crew' && participantType !== 'guest') {
      return NextResponse.json(
        { error: '잘못된 참가 유형입니다' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 회원가입 시 등록한 이름을 그대로 사용. 비어있으면 거부.
    const { data: me } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', session.user.id)
      .maybeSingle()

    const nickname = me?.nickname?.trim() ?? ''
    if (!nickname) {
      return NextResponse.json(
        { error: '먼저 회원 이름을 등록해주세요', redirect: '/onboarding/name' },
        { status: 400 }
      )
    }

    const [gradeRes, divisionRes] = await Promise.all([
      supabase.from('grades').select('id').eq('id', mainGrade).maybeSingle(),
      supabase
        .from('divisions')
        .select('id, active')
        .eq('id', divisionId)
        .maybeSingle(),
    ])

    if (!gradeRes.data) {
      return NextResponse.json(
        { error: '잘못된 도전 난이도입니다' },
        { status: 400 }
      )
    }
    if (!divisionRes.data || !divisionRes.data.active) {
      return NextResponse.json(
        { error: '잘못된 참가 부입니다' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 참가 신청을 완료했습니다' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        user_id: session.user.id,
        display_name: nickname,
        main_grade: mainGrade,
        division_id: divisionId,
        participant_type: participantType,
        agreed_to_terms: agreedToTerms,
      })
      .select()
      .single()

    if (error) {
      console.error('Participant signup error:', error)
      return NextResponse.json(
        { error: '신청 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      participant: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
