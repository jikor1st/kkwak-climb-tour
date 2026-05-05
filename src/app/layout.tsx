import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/lib/auth/session-provider";
import { SplashScreen } from "@/components/SplashScreen";
import { PWAProvider } from "@/components/PWAProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://kkwak-climb-tour.vercel.app");

const SITE_NAME = "꽉크루 볼구력 대회 2026";
const SITE_DESC =
  "강남 6개 암장, 단 하루. 각자의 색으로 정해진 시간 동안 풀어낸 만큼이 곧 결과.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "꽉크루",
    "볼구력",
    "볼구력 대회",
    "볼더링",
    "클라이밍",
    "더클라임",
    "더클",
    "강남 클라이밍",
    "클라이밍 대회",
    "2026",
  ],
  authors: [{ name: "꽉크루" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
    // images는 app/opengraph-image.tsx 가 자동 주입하므로 여기서 따로 지정하지 않는다.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
  // PWA: manifest는 app/manifest.ts가 자동으로 /manifest.webmanifest로 노출.
  // appleWebApp 설정으로 iOS 홈 화면 추가 시 standalone 모드 + 상태표시줄 색 일치.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#FAFAF7" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // PWA에서 zoom in/out 막진 않되 사용자 zoom 의도는 보장
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        {/* 세션 내 첫 방문에만 스플래시 — 이후 라우팅에는 즉시 숨김. blocking 스크립트라
            <body> 렌더 전에 html.splash-seen이 적용돼 깜빡임 없음. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('splash-seen')){document.documentElement.classList.add('splash-seen')}else{sessionStorage.setItem('splash-seen','1')}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full">
        <SplashScreen />
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <PWAProvider />
        <InstallPrompt />
      </body>
    </html>
  );
}
