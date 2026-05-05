import { auth } from "./auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  // 로그인 했지만 회원 이름이 비어있으면 강제 입력
  if (!session.user.name?.trim()) {
    redirect("/onboarding/name")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'admin') {
    redirect("/?error=forbidden")
  }
  return session
}

export async function requireParticipant() {
  const session = await requireAuth()
  if (!session.user.participant) {
    redirect("/signup")
  }
  return session
}

export async function getAuthOrUnauthorized() {
  const session = await auth()
  return session
}
