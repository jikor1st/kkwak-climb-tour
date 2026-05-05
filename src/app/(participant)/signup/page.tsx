import { createServerClient } from '@/lib/supabase/server'
import { loadDifficultySystem } from '@/lib/contest/grades'
import { SignupForm } from './SignupForm'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  const supabase = createServerClient()
  const [settingsRes, system] = await Promise.all([
    supabase
      .from('contest_settings')
      .select('signup_notice, contest_date')
      .eq('id', 1)
      .maybeSingle(),
    loadDifficultySystem(),
  ])

  return (
    <SignupForm
      signupNotice={settingsRes.data?.signup_notice ?? ''}
      contestDate={settingsRes.data?.contest_date ?? null}
      grades={system.grades}
      divisions={system.divisions.filter((d) => d.active)}
      recommendations={system.recommendations}
    />
  )
}
