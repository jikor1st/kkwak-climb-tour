-- 0004: 난이도/부/랭킹 그룹 동적 관리 체계
--
-- 변경 요지
-- - 색(난이도)·부(division)·랭킹 그룹을 하드코딩에서 DB 관리로 전환
-- - 도전 난이도 → 추천 부 매핑도 DB에 저장
-- - 기존 상급/중급/초급 카테고리를 부(빨강부/파랑부/초록부)로 자동 변환
-- - 랭킹은 ranking_group 단위로 합산 (% 비교라 다른 색이 같이 묶여도 공정)
--
-- 기존 동작 보존
-- - '상급 단독 랭킹' → 1그룹(빨강부 + 핑크부)으로 흡수
-- - '중급+초급 합산' → 2그룹(파랑부 + 초록부)으로 그대로

-- =========================================================================
-- 1) 스키마
-- =========================================================================

-- 색(난이도) 마스터
create table grades (
  id text primary key,            -- 'red', 'pink', 'blue', ...
  label text not null,            -- '빨강', '핑크', '파랑', ...
  color_hex text not null,        -- '#DC2626'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_grades_sort on grades(sort_order);

-- 랭킹 그룹: 그룹 내 모든 부의 참가자를 % 기준으로 한 줄에 세움
create table ranking_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- '1그룹', '2그룹'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 부 (division)
create table divisions (
  id uuid primary key default gen_random_uuid(),
  label text not null,                                 -- '핑크부', '빨강부'
  solve_grade text not null references grades(id),     -- 이 부가 푸는 색
  ranking_group_id uuid references ranking_groups(id) on delete set null,
  sort_order int not null default 0,
  desc_text text not null default '',                  -- 설명(신청 폼 표기)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_divisions_group on divisions(ranking_group_id);
create index idx_divisions_sort on divisions(sort_order);

-- 도전 난이도(평소 푸는 색) → 추천 부 매핑
create table division_recommendations (
  challenge_grade text not null references grades(id) on delete cascade,
  division_id uuid not null references divisions(id) on delete cascade,
  primary key (challenge_grade, division_id)
);

create index idx_division_recommendations_grade on division_recommendations(challenge_grade);

-- =========================================================================
-- 2) participants 에 division_id 추가 (NULL 허용 상태로 일단 추가)
-- =========================================================================

alter table participants add column division_id uuid;

-- =========================================================================
-- 3) 시드 + 기존 데이터 변환
-- =========================================================================

do $$
declare
  g1 uuid; g2 uuid;
  d_pink uuid; d_red uuid; d_blue uuid; d_green uuid;
begin
  -- 색 마스터
  insert into grades (id, label, color_hex, sort_order) values
    ('purple', '보라',  '#9333EA', 1),
    ('pink',   '핑크',  '#DB2777', 2),
    ('red',    '빨강',  '#DC2626', 3),
    ('blue',   '파랑',  '#2563EB', 4),
    ('green',  '초록',  '#16A34A', 5);

  -- 랭킹 그룹 2개
  insert into ranking_groups (name, sort_order) values ('1그룹', 1) returning id into g1;
  insert into ranking_groups (name, sort_order) values ('2그룹', 2) returning id into g2;

  -- 부 4개
  insert into divisions (label, solve_grade, ranking_group_id, sort_order, desc_text)
    values ('핑크부', 'pink', g1, 1, '핑크 풀이') returning id into d_pink;
  insert into divisions (label, solve_grade, ranking_group_id, sort_order, desc_text)
    values ('빨강부', 'red', g1, 2, '빨강 풀이') returning id into d_red;
  insert into divisions (label, solve_grade, ranking_group_id, sort_order, desc_text)
    values ('파랑부', 'blue', g2, 1, '파랑 풀이') returning id into d_blue;
  insert into divisions (label, solve_grade, ranking_group_id, sort_order, desc_text)
    values ('초록부', 'green', g2, 2, '초록 풀이') returning id into d_green;

  -- 도전 난이도 → 추천 부 (기존 SignupForm RECOMMENDED 매핑 보존)
  --   purple → advanced(빨강부)
  --   pink   → advanced(빨강부) + intermediate(파랑부)
  --   red    → intermediate(파랑부) + beginner(초록부)
  --   blue   → beginner(초록부)
  insert into division_recommendations (challenge_grade, division_id) values
    ('purple', d_red),
    ('pink',   d_red),
    ('pink',   d_blue),
    ('red',    d_blue),
    ('red',    d_green),
    ('blue',   d_green);

  -- 기존 participants.category → division_id 자동 매핑
  update participants set division_id = d_red   where category = 'advanced';
  update participants set division_id = d_blue  where category = 'intermediate';
  update participants set division_id = d_green where category = 'beginner';
end $$;

-- =========================================================================
-- 4) 무결성: division_id NOT NULL + FK 제약
-- =========================================================================

alter table participants alter column division_id set not null;

alter table participants
  add constraint participants_division_id_fkey
  foreign key (division_id) references divisions(id);

alter table participants
  add constraint participants_main_grade_fkey
  foreign key (main_grade) references grades(id);

alter table grade_counts
  add constraint grade_counts_grade_fkey
  foreign key (grade) references grades(id);

alter table solves
  add constraint solves_grade_fkey
  foreign key (grade) references grades(id);

create index idx_participants_division on participants(division_id);

-- =========================================================================
-- 5) 구 컬럼 정리: category 는 더 이상 사용 안 함 (NOT NULL 해제)
--    데이터는 보존(필요시 어드민이 참조). 이후 마이그레이션에서 drop 예정.
-- =========================================================================

drop index if exists idx_participants_category;
alter table participants alter column category drop not null;
