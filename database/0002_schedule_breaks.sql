-- 0002: 지점 사이 커스텀 시간 (점심·이동·휴식 등)
-- after_gym_id = null  → 첫 지점 이전 (워밍업 등)
-- after_gym_id = <id>  → 해당 지점 직후
-- 동일 after_gym_id 안에서는 display_order 오름차순
create table schedule_breaks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int not null check (duration_minutes >= 0 and duration_minutes <= 600),
  after_gym_id uuid references gyms(id) on delete cascade,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_schedule_breaks_after on schedule_breaks(after_gym_id, display_order);
