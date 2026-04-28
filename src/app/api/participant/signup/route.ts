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
    const { displayName, mainGrade, category, participantType, agreedToTerms } = body

    // 유효성 검사
    if (!displayName || !mainGrade || !category || !participantType) {
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

    const supabase = createServerClient()

    // 이미 신청했는지 확인
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

    // 참가자 등록
    const { data, error } = await supabase
      .from('participants')
      .insert({
        user_id: session.user.id,
        display_name: displayName,
        main_grade: mainGrade,
        category,
        participant_type: participantType,
        agreed_to_terms: agreedToTerms
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