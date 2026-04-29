import { createServerClient } from '@/lib/supabase/server'
import { SignupForm } from './SignupForm'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('contest_settings')
    .select('signup_notice, contest_date')
    .eq('id', 1)
    .maybeSingle()

  return (
    <SignupForm
      signupNotice={data?.signup_notice ?? ''}
      contestDate={data?.contest_date ?? null}
    />
  )
}
