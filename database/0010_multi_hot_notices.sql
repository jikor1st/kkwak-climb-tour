-- 0010: 핫 공지 다건화
--
-- 변경 요지
-- - 0008/0009에서 contest_settings.notice / notice_updated_at으로 단일 핫 공지를
--   관리했으나, 운영 중 동시에 여러 알림을 띄울 수 있어야 한다는 요구가
--   생겼다. 별도 테이블로 분리해 N건 관리.
-- - 사용자별 dismiss는 클라이언트 localStorage에 { id → updated_at } 맵으로
--   저장. 어드민이 본문을 갱신하면 updated_at이 새로 찍혀 dismiss가 무효화.

create table hot_notices (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_hot_notices_order on hot_notices(display_order, created_at);

-- 기존 단일 핫 공지 데이터가 있으면 첫 번째 행으로 이관
insert into hot_notices (body, display_order, created_at, updated_at)
select
  notice,
  0,
  coalesce(notice_updated_at, now()),
  coalesce(notice_updated_at, now())
from contest_settings
where id = 1
  and notice is not null
  and length(trim(notice)) > 0;

-- 단일 컬럼은 이제 사용하지 않음 — drop
alter table contest_settings
  drop column if exists notice,
  drop column if exists notice_updated_at;
