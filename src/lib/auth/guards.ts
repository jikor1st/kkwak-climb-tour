import { auth } from "./auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
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