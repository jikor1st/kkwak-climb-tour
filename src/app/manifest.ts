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
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF7",
    theme_color: "#DC2626",
    categories: ["sports", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/kakao-app-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
