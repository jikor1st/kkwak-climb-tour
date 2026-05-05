import { createServerClient } from '@/lib/supabase/server'
import { loadDifficultySystem } from '@/lib/contest/grades'
import type { PaymentInfo } from '@/lib/contest/load'
import { SignupForm } from './SignupForm'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  const supabase = createServerClient()
  const [settingsRes, system] = await Promise.all([
    supabase
      .from('contest_settings')
      .select(
        'contest_date, entry_fee, bank_name, account_number, account_holder, kakaopay_link, toss_link, signup_notice',
      )
      .eq('id', 1)
      .maybeSingle(),
    loadDifficultySystem(),
  ])

  const s = settingsRes.data
  const paymentInfo: PaymentInfo = {
    entryFee: s?.entry_fee ?? 10000,
    bankName: (s?.bank_name ?? '').trim(),
    accountNumber: (s?.account_number ?? '').trim(),
    accountHolder: (s?.account_holder ?? '').trim(),
    kakaopayLink: (s?.kakaopay_link ?? '').trim(),
    tossLink: (s?.toss_link ?? '').trim(),
    notice: (s?.signup_notice ?? '').trim(),
  }

  return (
    <SignupForm
      paymentInfo={paymentInfo}
      contestDate={s?.contest_date ?? null}
      grades={system.grades}
      divisions={system.divisions.filter((d) => d.active)}
      recommendations={system.recommendations}
    />
  )
}
