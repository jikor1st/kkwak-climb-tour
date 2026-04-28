-- THE CLIMB TOUR 2026 초기 데이터베이스 스키마
-- Supabase SQL Editor에서 실행

-- 사용자 테이블
create table users (
  id uuid primary key default gen_random_uuid(),
  kakao_id text unique not null,           -- 카카오 ID (식별자)
  nickname text not null,                  -- 카카오 닉네임 (가입 시점 스냅샷)
  role text not null default 'participant', -- 'participant' | 'admin'
  created_at timestamptz not null default now()
);

create index idx_users_kakao on users(kakao_id);

-- 참가자 테이블
create table participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,                          -- 본인 입력 이름
  main_grade text not null,                            -- 'red' | 'pink' | 'purple'
  category text not null,                              -- 'advanced' | 'intermediate' | 'beginner'
  participant_type text not null,                      -- 'crew' | 'guest'
  agreed_to_terms boolean not null default false,
  paid boolean not null default false,                 -- 입금 여부 (어드민 수동)
  created_at timestamptz not null default now(),
  unique(user_id)
);

create index idx_participants_category on participants(category);
create index idx_participants_paid on participants(paid);

-- 지점 테이블
create table gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- '신사', '논현', ...
  display_order int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 벽 테이블
create table walls (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  name text not null,               -- '1번벽', '슬랩벽' 등
  display_order int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(gym_id, name)
);

create index idx_walls_gym on walls(gym_id);

-- 벽 × 그레이드 갯수 테이블
create table grade_counts (
  id uuid primary key default gen_random_uuid(),
  wall_id uuid not null references walls(id) on delete cascade,
  grade text not null,              -- 'red' | 'blue' | 'green'
  total_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(wall_id, grade)
);

create index idx_grade_counts_wall on grade_counts(wall_id);

-- 풀이 기록 테이블
create table solves (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  wall_id uuid not null references walls(id) on delete cascade,
  grade text not null,              -- 'red' | 'blue' | 'green'
  solved_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(participant_id, wall_id, grade)
);

create index idx_solves_participant on solves(participant_id);
create index idx_solves_wall on solves(wall_id);

-- 대회 설정 테이블 (단일 행)
create table contest_settings (
  id int primary key default 1,

  -- 메타
  contest_name text not null default '강남권 더클 뿌수기 대회',
  contest_subtitle text not null default 'THE CLIMB TOUR',
  contest_date date not null default '2026-05-10',

  -- 시간 (미정 시 NULL 허용)
  start_time time,
  end_time time,
  default_gym_minutes int not null default 45,
  lunch_minutes int not null default 60,
  lunch_start_time time,

  -- 참가비
  entry_fee int not null default 10000,

  -- 텍스트 정의 (마크다운 미지원, 평문)
  challenge_grade_definition text not null default '최근 두 달, 두 군데 이상 지점에서 풀어본 적 있는 가장 높은 색',
  pink_guide_advanced text not null default '여러 지점에서 빨강을 한 세션에 절반 이상 풀 수 있어요',
  pink_guide_intermediate text not null default '빨강이 지점 따라 갈리고, 파랑은 무난해요',
  red_guide_intermediate text not null default '파랑을 한 세션에 무난히 풀 수 있어요',
  red_guide_beginner text not null default '파랑도 6개 지점 다 돌기는 부담스러워요',

  -- 공지 (대시보드 상단)
  notice text,

  -- 결과 잠금
  results_locked boolean not null default false,

  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- 지점별 체류 시간 테이블
create table gym_durations (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade unique,
  duration_minutes int not null default 45,
  updated_at timestamptz not null default now()
);

-- 팀 테이블
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- 'A팀', 'B팀', ...
  start_wall_assignments jsonb,             -- [{ gym_id, wall_id }] - 지점별 첫 시작 벽
  created_at timestamptz not null default now()
);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  primary key (team_id, participant_id)
);

-- 시드 데이터
-- 6개 지점
insert into gyms (name, display_order) values
  ('신사', 1),
  ('논현', 2),
  ('강남', 3),
  ('양재', 4),
  ('사당', 5),
  ('이수', 6);

-- 지점별 기본 체류시간
insert into gym_durations (gym_id, duration_minutes)
  select id, 45 from gyms;

-- 대회 설정 단일 행
insert into contest_settings (id) values (1);