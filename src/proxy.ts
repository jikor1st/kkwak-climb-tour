import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  // 보호가 필요한 경로들
  const protectedPaths = ['/signup', '/input', '/dashboard', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 로그인이 필요한 페이지인데 로그인하지 않은 경우
  if (isProtectedPath && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 어드민 페이지 접근 제어
  if (pathname.startsWith('/admin')) {
    if (req.auth?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 이미 로그인한 사용자가 로그인 페이지 접근 시 홈으로 리다이렉트
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}