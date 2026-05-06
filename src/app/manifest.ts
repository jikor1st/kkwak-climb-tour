import type { MetadataRoute } from "next"

const SITE_NAME = "꽉크루 볼구력 대회 2026"
const SHORT_NAME = "꽉크루"
const SITE_DESC =
  "강남 6개 암장, 단 하루. 각자의 색으로 정해진 시간 동안 풀어낸 만큼이 곧 결과."

// PWA 설치 시 홈 화면에 들어가는 메타. 색은 globals.css의 --color-paper /
// --color-accent와 맞춰 OS 상태 표시줄까지 자연스럽게 이어지도록 한다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SHORT_NAME,
    description: SITE_DESC,
    lang: "ko",
    // 비로그인 상태에서도 200을 응답하는 루트로 둠. start_url이 인증 리다이렉트를
    // 거치면 일부 환경에서 설치 가능 신호가 흔들릴 수 있어 안전한 '/'로.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF7",
    theme_color: "#DC2626",
    categories: ["sports", "lifestyle"],
    // Chrome 설치 가능 판정에는 192/512 PNG 두 사이즈가 모두 필요 — SVG만 있으면 X.
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
