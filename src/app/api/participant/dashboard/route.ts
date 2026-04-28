import { auth } from '@/lib/auth/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // 참가자 정보 조회
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (pError || !participant) {
      return NextResponse.json({
        participant: null,
        solves: []
      })
    }

    // 풀이 기록 조회
    const { data: solves, error: sError } = await supabase
      .from('solves')
      .select(`
        *,
        wall:walls!inner(
          name,
          gym:gyms!inner(name)
        )
      `)
      .eq('participant_id', participant.id)

    // 데이터 변환
    const formattedSolves = solves?.map(solve => ({
      gym_name: solve.wall.gym.name,
      wall_name: solve.wall.name,
      grade: solve.grade,
      solved_count: solve.solved_count,
      total_count: 0 // 나중에 grade_counts에서 가져올 예정
    })) || []

    return NextResponse.json({
      participant,
      solves: formattedSolves
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}