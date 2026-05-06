-- 0012: 웹 푸시 구독 테이블
--
-- 변경 요지
-- - 핫 공지 발화 시 어드민이 수동으로 푸시를 보낼 수 있도록 구독 저장.
-- - endpoint(고유 URL)가 자연 PK. 같은 사용자가 여러 디바이스에 구독해도 endpoint는 다름.
-- - user_id는 nullable — 비로그인 상태에서도 구독은 가능하지만, 운영상 보호 페이지에서만
--   노출되므로 실질적으로 항상 채워진다고 봐도 된다.
-- - p256dh / auth는 web-push 페이로드 암호화에 필요한 클라이언트별 공개 키와 인증 시크릿.

create table push_subscriptions (
  endpoint text primary key,
  user_id uuid references users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);
