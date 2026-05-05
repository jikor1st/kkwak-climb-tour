import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // PWA service worker는 app/sw/route.ts에서 생성하지만, 브라우저는 관례상
  // /sw.js 경로를 신뢰한다. /sw.js로 들어온 요청을 라우트 핸들러로 보낸다.
  async rewrites() {
    return [{ source: "/sw.js", destination: "/sw" }]
  },
}

export default nextConfig
