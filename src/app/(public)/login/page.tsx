import { signIn } from "@/lib/auth/auth"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">THE CLIMB TOUR</h1>
          <p className="text-ink-700">강남권 더클 뿌수기 대회</p>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
          <h2 className="text-xl font-bold mb-6 text-center">로그인</h2>

          <form
            action={async () => {
              "use server"
              await signIn("kakao", { redirectTo: "/post-login" })
            }}
          >
            <button
              type="submit"
              className="w-full py-4 bg-[#FEE500] hover:bg-[#FEE500]/90 transition rounded-xl font-bold text-[#000000] text-base flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 1.5C5.85786 1.5 2.5 4.08947 2.5 7.25C2.5 9.47368 3.94737 11.4737 6.14474 12.5526L5.25 16L9.21053 13.5789C9.47105 13.5921 9.73421 13.6 10 13.6C14.1421 13.6 17.5 11.0105 17.5 7.85C17.5 4.68947 14.1421 1.5 10 1.5Z"
                  fill="currentColor"
                />
              </svg>
              카카오로 시작하기
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-500 leading-relaxed">
              참가 신청을 위해 카카오 계정으로 로그인해주세요.<br/>
              닉네임 정보만 사용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}