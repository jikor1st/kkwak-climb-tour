import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"

export const dynamic = "force-dynamic"

export default async function PostLoginPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.participant) {
    redirect("/dashboard")
  }

  redirect("/signup")
}
