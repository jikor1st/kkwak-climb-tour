import NextAuth from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import { createServerClient } from "../supabase/server"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "kakao") {
        try {
          const supabase = createServerClient()

          // users 테이블에 upsert
          const { error } = await supabase
            .from('users')
            .upsert(
              {
                kakao_id: account.providerAccountId,
                nickname: user.name || '',
              },
              {
                onConflict: 'kakao_id',
                ignoreDuplicates: false,
              }
            )

          if (error) {
            console.error('Supabase user upsert error:', error)
            return false
          }

          return true
        } catch (error) {
          console.error('SignIn callback error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (!token?.sub) return session

      try {
        const supabase = createServerClient()

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('kakao_id', token.sub)
          .single()

        if (userError || !user) {
          console.error('[session] user lookup error:', userError)
          return session
        }

        session.user.id = user.id
        session.user.role = user.role

        const { data: participants, error: pError } = await supabase
          .from('participants')
          .select('id, display_name, main_grade, category, participant_type, paid')
          .eq('user_id', user.id)
          .limit(1)

        if (pError) {
          console.error('[session] participants lookup error:', pError)
        }

        session.user.participant = participants?.[0]
          ? { ...participants[0], teams: [] }
          : null

        return session
      } catch (error) {
        console.error('[session] callback error:', error)
        return session
      }
    },
    async jwt({ token, account }) {
      if (account?.provider === "kakao") {
        token.sub = account.providerAccountId
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'participant' | 'admin'
      participant: {
        id: string
        display_name: string
        main_grade: 'purple' | 'pink' | 'red' | 'blue'
        category: 'advanced' | 'intermediate' | 'beginner'
        participant_type: 'crew' | 'guest'
        paid: boolean
        teams?: {
          team: {
            id: string
            name: string
          }
        }[]
      } | null
    }
  }
}