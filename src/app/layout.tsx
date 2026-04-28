import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/lib/auth/session-provider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://kkwak-climb-tour.vercel.app");

const SITE_NAME = "꽉크루 클라이밍 투어 2026";
const SITE_DESC =
  "강남 6개 지점, 하루 안에 정주행. 평소보다 살짝 쉬운 색을 정한 시간 안에 누가 더 많이 풀까?";

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
    "클라이밍",
    "더클라임",
    "더클",
    "강남 클라이밍",
    "클라이밍 대회",
    "클라이밍 투어",
    "2026",
  ],
  authors: [{ name: "꽉크루" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
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
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
