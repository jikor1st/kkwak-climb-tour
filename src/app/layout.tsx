import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/lib/auth/session-provider";

export const metadata: Metadata = {
  title: "꽉크루 클라이밍 투어 2026",
  description: "꽉크루 클라이밍 투어 2026 · 강남 6개 지점, 하루 안에 정주행.",
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
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
