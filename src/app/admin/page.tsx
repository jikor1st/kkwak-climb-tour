import Link from "next/link"
import { requireAdmin } from "@/lib/auth/guards"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminHome() {
  await requireAdmin()
  const supabase = createServerClient()

  const [gymsRes, wallsRes, gcRes, partRes, paidRes, settingsRes] =
    await Promise.all([
      supabase.from("gyms").select("id", { count: "exact", head: true }),
      supabase
        .from("walls")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase.from("grade_counts").select("total_count"),
      supabase.from("participants").select("id", { count: "exact", head: true }),
      supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("paid", true),
      supabase
        .from("contest_settings")
        .select("start_time")
        .eq("id", 1)
        .maybeSingle(),
    ])

  const gymCount = gymsRes.count ?? 0
  const wallCount = wallsRes.count ?? 0
  const totalProblems =
    gcRes.data?.reduce((s, g) => s + (g.total_count ?? 0), 0) ?? 0
  const participantCount = partRes.count ?? 0
  const paidCount = paidRes.count ?? 0
  const scheduleSet = !!settingsRes.data?.start_time

  return (
    <div className="max-w-5xl mx-auto px-5 pt-8 pb-20">
      <div className="mb-6">
        <div className="text-xs text-accent uppercase tracking-[0.2em] font-black mb-2">
          ADMIN
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          운영자 콘솔
        </h1>
        <p className="text-sm text-ink-700 mt-2">
          대회 운영에 필요한 데이터를 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="지점" value={gymCount} />
        <Stat label="등록된 벽" value={wallCount} />
        <Stat label="총 문제 수" value={totalProblems} />
        <Stat
          label="참가자"
          value={`${paidCount}/${participantCount}`}
          sub={`입금 ${participantCount > 0 ? Math.round((paidCount / participantCount) * 100) : 0}%`}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <AdminCard
          href="/admin/difficulty"
          eyebrow="STEP 0"
          title="난이도 · 부 · 랭킹 그룹"
          desc="색·참가 부·랭킹 그룹·도전 난이도→추천 부 매핑을 관리합니다."
        />
        <AdminCard
          href="/admin/walls"
          eyebrow="STEP 1"
          title="벽 · 문제 수 등록"
          desc="6개 암장의 벽과 색별 문제 수를 입력합니다."
          required={wallCount === 0 || totalProblems === 0}
        />
        <AdminCard
          href="/admin/participants"
          eyebrow="STEP 2"
          title="참가자 · 입금 확인"
          desc="신청자 목록을 확인하고 입금 완료를 표시합니다."
          required={participantCount > paidCount}
        />
        <AdminCard
          href="/admin/users"
          eyebrow="권한"
          title="회원 · 권한 관리"
          desc="가입한 모든 카카오 회원에게 어드민 권한을 부여·해제합니다."
        />
        <AdminCard
          href="/admin/schedule"
          eyebrow="STEP 3"
          title="대회 일정"
          desc="시작·종료, 점심시간, 지점별 체류시간을 설정합니다."
          required={!scheduleSet}
        />
        <AdminCard
          href="/admin/notice"
          eyebrow="STEP 4"
          title="참가 신청 안내문구"
          desc="신청 직전 확인 다이얼로그에 보일 입금 계좌·안내 문구를 작성합니다."
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4 shadow-soft">
      <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold mb-1">
        {label}
      </div>
      <div className="text-2xl font-black num">{value}</div>
      {sub && <div className="text-[11px] text-ink-500 font-bold mt-0.5">{sub}</div>}
    </div>
  )
}

function AdminCard({
  href,
  eyebrow,
  title,
  desc,
  required,
}: {
  href: string
  eyebrow: string
  title: string
  desc: string
  required?: boolean
}) {
  return (
    <Link
      href={href}
      className="group block bg-surface border border-line hover:border-accent rounded-3xl p-6 shadow-soft hover:shadow-card transition"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">
          {eyebrow}
        </span>
        {required && (
          <span className="text-[10px] font-black text-accent bg-accent-soft border border-accent/20 px-2 py-0.5 rounded-full">
            처리 필요
          </span>
        )}
      </div>
      <h2 className="text-xl font-black mb-2 group-hover:text-accent transition">
        {title}
      </h2>
      <p className="text-sm text-ink-700">{desc}</p>
      <div className="mt-4 text-sm font-black text-ink-700 group-hover:text-accent transition">
        들어가기 →
      </div>
    </Link>
  )
}
