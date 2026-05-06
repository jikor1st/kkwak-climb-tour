import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"
import { getIsKakaoTalkWebview } from "@/lib/utils/kakaotalk"

const INAPP_PATH = "/inappbrowser"

export default auth((req) => {
  const { pathname, search } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  // 카카오톡 인앱 브라우저 — PWA 설치/푸시 권한 요청이 막혀있어
  // 외부 브라우저로 안내. /inappbrowser 자체에선 다시 redirect 하지 않게 가드.
  if (!pathname.startsWith(INAPP_PATH)) {
    const ua = req.headers.get("user-agent")
    if (getIsKakaoTalkWebview(ua)) {
      const target = new URL(INAPP_PATH, req.url)
      target.searchParams.set("next", `${pathname}${search}`)
      return NextResponse.redirect(target)
    }
  }

  const protectedPaths = ['/signup', '/input', '/dashboard', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}