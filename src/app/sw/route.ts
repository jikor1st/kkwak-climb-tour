import { NextResponse } from "next/server"

// 빌드 단위 캐시 버전. 새로 빌드/배포할 때마다 값이 바뀌어 SW 본문 자체도 바뀌고,
// 이게 브라우저가 새 SW를 install → activate 시키는 트리거가 된다.
// - Vercel: VERCEL_GIT_COMMIT_SHA 자동 주입
// - 그 외: NEXT_PUBLIC_BUILD_ID 가 있으면 사용, 마지막 fallback은 모듈 로드 시각
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  String(Date.now())

// 모든 GET 요청은 SW 본문을 그대로 반환. 같은 빌드 내에서는 동일한 본문이지만
// 새 빌드에서는 BUILD_ID가 달라져서 본문이 갱신됨.
export async function GET() {
  const body = buildSwSource(BUILD_ID)
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // SW 자체는 절대 캐시하지 않는다 — 새 빌드를 즉시 감지하기 위함.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      // 루트 스코프에서 동작 가능하도록.
      "Service-Worker-Allowed": "/",
    },
  })
}

function buildSwSource(version: string): string {
  // 캐시 전략
  // - 정적 자산 (/_next/static/*, 이미지, 폰트): CacheFirst
  //   → 해시 URL이라 영구 immutable. 캐시 명에 BUILD_ID를 포함시키면
  //     새 빌드 시 통째로 폐기.
  // - HTML / navigation: NetworkFirst → 항상 신선한 HTML, 오프라인 시 마지막 캐시.
  // - API / 인증 / Server Action: 캐시 안 함 (NetworkOnly).
  // - controllerchange 시 클라가 reload하므로 SW skipWaiting은 client message로 트리거.
  return `// kkwak-climb-tour service worker
// auto-generated. version=${version}

const VERSION = ${JSON.stringify(version)};
const STATIC_CACHE = 'kct-static-' + VERSION;
const RUNTIME_CACHE = 'kct-runtime-' + VERSION;

self.addEventListener('install', (event) => {
  // 새 SW를 설치만 하고 활성화는 사용자 동의 후 (skipWaiting 메시지)
  // 즉시 활성화하면 현재 페이지가 타이밍 꼬인 채 새로 fetch 받을 수 있음.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 이전 빌드의 캐시들을 모두 제거
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('kct-') && !k.endsWith(VERSION))
        .map((k) => caches.delete(k)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 웹 푸시 수신. 페이로드 JSON: { title, body, url?, tag? }
self.addEventListener('push', (event) => {
  let payload = { title: '꽉크루', body: '새 공지가 도착했어요', url: '/dashboard', tag: 'kct-default' };
  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      try { payload.body = event.data.text(); } catch (_) {}
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag,
      // 같은 tag로 들어와도 새 알림이 시각/소리 트리거하도록.
      renotify: true,
      data: { url: payload.url || '/dashboard' },
    }),
  );
});

// 알림 클릭 — 이미 열린 탭이 있으면 포커스, 없으면 새 창.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      try {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) {
            try { await client.navigate(target); } catch (_) {}
          }
          return;
        }
      } catch (_) {}
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(target);
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // API / 인증 / NextAuth callback / Server Actions: 캐시 금지
  if (url.pathname.startsWith('/api/')) return;

  // 정적 자산 (해시 URL — immutable)
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // HTML 네비게이션
  const accept = req.headers.get('accept') || '';
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // 그 외는 SW가 손대지 않음 → 브라우저 기본 캐시 동작
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    if (hit) return hit;
    throw err;
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // 마지막 fallback: 루트 페이지의 캐시
    const root = await cache.match('/');
    if (root) return root;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>오프라인</title>' +
      '<style>body{font-family:system-ui;padding:40px;text-align:center;color:#0a0a0a}h1{font-size:20px;margin-bottom:8px}p{color:#6b6b6b;font-size:14px}</style>' +
      '<h1>오프라인 상태예요</h1><p>네트워크에 다시 연결되면 새로고침해주세요.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}
`
}
