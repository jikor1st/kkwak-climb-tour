# 데이터 모델 + API 명세

## 1. 데이터베이스 스키마 (Supabase / Postgres)

### 사용자 (users)

next-auth가 관리하는 세션 외에, 우리 도메인의 사용자 정보를 별도 테이블로 관리.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  kakao_id text unique not null,           -- 카카오 ID (식별자)
  nickname text not null,                  -- 카카오 닉네임 (가입 시점 스냅샷)
  role text not null default 'participant', -- 'participant' | 'admin'
  created_at timestamptz not null default now()
);

create index idx_users_kakao on users(kakao_id);
```

### 참가자 (participants)

신청 정보. 한 user_id당 1행.

```sql
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
```

### 지점 (gyms)

```sql
create table gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- '신사', '논현', ...
  display_order int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 벽 (walls)

```sql
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
```

### 벽 × 그레이드 갯수 (grade_counts)

```sql
create table grade_counts (
  id uuid primary key default gen_random_uuid(),
  wall_id uuid not null references walls(id) on delete cascade,
  grade text not null,              -- 'red' | 'blue' | 'green'
  total_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(wall_id, grade)
);

create index idx_grade_counts_wall on grade_counts(wall_id);
```

### 풀이 기록 (solves)

참가자별 × 벽별 × 그레이드별 본인 완등 갯수.

```sql
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
```

### 대회 설정 (contest_settings)

단일 행으로 운영. 어드민이 모든 텍스트 편집 가능.

```sql
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
```

### 지점별 체류 시간 (gym_durations)

당일 어드민이 동적 조정.

```sql
create table gym_durations (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade unique,
  duration_minutes int not null default 45,
  updated_at timestamptz not null default now()
);
```

### 팀 (teams)

```sql
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
```

`start_wall_assignments` 예시:
```json
[
  { "gym_id": "uuid-신사", "wall_id": "uuid-신사-1번벽" },
  { "gym_id": "uuid-논현", "wall_id": "uuid-논현-2번벽" }
]
```

---

## 2. 시드 데이터 (Migration 0001)

```sql
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
```

---

## 3. API 명세

### 인증 / 사용자

#### `GET /api/users/me`
현재 로그인한 사용자 정보.

```json
// 응답
{
  "id": "uuid",
  "kakaoId": "12345",
  "nickname": "Lego",
  "role": "participant",
  "participant": null  // 또는 participant 정보
}
```

### 참가 신청

#### `POST /api/participants`
참가 신청.

```json
// 요청
{
  "displayName": "레고",
  "mainGrade": "pink",
  "category": "advanced",
  "participantType": "crew",
  "agreedToTerms": true
}

// 응답 201
{
  "id": "uuid",
  "displayName": "레고",
  "mainGrade": "pink",
  "category": "advanced",
  "participantType": "crew",
  "paid": false
}

// 에러
400 - 검증 실패 (mainGrade와 category 매핑 안 맞음)
401 - 비로그인
409 - 이미 신청함
```

#### `GET /api/participants/me`
내 신청 정보.

```json
// 응답 200 (있음)
{
  "id": "uuid",
  "displayName": "레고",
  "mainGrade": "pink",
  "category": "advanced",
  "participantType": "crew",
  "paid": false,
  "team": { "id": "uuid", "name": "A팀" } // 또는 null
}

// 응답 404 (신청 안함)
```

### 대회 설정

#### `GET /api/contest/settings`
공개 (비로그인도 호출 가능).

```json
{
  "contestName": "강남권 더클 뿌수기 대회",
  "contestSubtitle": "THE CLIMB TOUR",
  "contestDate": "2026-05-10",
  "startTime": null,  // 또는 "09:30"
  "endTime": null,
  "lunchStartTime": null,
  "lunchMinutes": 60,
  "entryFee": 10000,
  "challengeGradeDefinition": "...",
  "pinkGuideAdvanced": "...",
  "pinkGuideIntermediate": "...",
  "redGuideIntermediate": "...",
  "redGuideBeginner": "...",
  "notice": null,  // 공지
  "resultsLocked": false
}
```

### 지점 / 벽 / 갯수

#### `GET /api/walls`
현재 카테고리 기준 활성 지점/벽/갯수. 참가자만.

```json
{
  "gyms": [
    {
      "id": "uuid",
      "name": "신사",
      "displayOrder": 1,
      "walls": [
        {
          "id": "uuid",
          "name": "1번벽",
          "displayOrder": 1,
          "gradeCounts": {
            "red": 5,
            "blue": 3,
            "green": 4
          }
        }
      ]
    }
  ]
}
```

### 풀이 기록

#### `GET /api/solves/me`
내 풀이 기록 전체.

```json
{
  "solves": [
    { "wallId": "uuid", "grade": "red", "solvedCount": 3 }
  ],
  "totalSolved": 27,
  "totalAvailable": 90,
  "ratio": 0.30
}
```

#### `PUT /api/solves`
풀이 기록 업서트.

```json
// 요청
{
  "wallId": "uuid",
  "grade": "red",
  "solvedCount": 3
}

// 응답 200
{
  "wallId": "uuid",
  "grade": "red",
  "solvedCount": 3,
  "updatedAt": "2026-05-10T11:24:32Z"
}

// 에러
400 - solvedCount > total_count, 음수, 본인 카테고리에 안 맞는 grade
401 - 비로그인
403 - 참가 신청 안 함
404 - wall_id 없음
```

서버 검증:
1. 세션 + 참가자 확인
2. 본인 category에 해당하는 grade인지
   - advanced → red
   - intermediate → blue
   - beginner → green
3. solvedCount ≤ total_count (해당 wall × grade)
4. solvedCount ≥ 0
5. upsert (`participant_id, wall_id, grade` unique)

### 대시보드

#### `GET /api/dashboard`
대시보드 데이터 일괄 조회.

```json
{
  "notice": "양재점 사람 많아 50분 → 60분 연장",
  "myProgress": {
    "displayName": "레고",
    "category": "advanced",
    "categoryLabel": "상급조 · 빨강 풀이",
    "teamName": "A팀",
    "totalSolved": 27,
    "totalAvailable": 90,
    "ratio": 0.30,
    "rank": 4,
    "totalInGroup": 18  // 부문 내 인원수
  },
  "rankings": {
    "advanced": [
      {
        "participantId": "uuid",
        "displayName": "김XX",
        "totalSolved": 45,
        "totalAvailable": 90,
        "ratio": 0.50,
        "rank": 1,
        "isGuest": false,
        "isMe": false
      }
    ],
    "intermediate": [
      {
        "participantId": "uuid",
        "displayName": "박XX",
        "totalSolved": 50,
        "totalAvailable": 100,
        "ratio": 0.50,
        "rank": 1,
        "isGuest": true,
        "isMe": false
      }
    ],
    "beginner": [
      {
        "participantId": "uuid",
        "displayName": "이XX",
        "totalSolved": 35,
        "totalAvailable": 80,
        "ratio": 0.4375,
        "rank": 1,
        "isGuest": false,
        "isMe": false
      }
    ]
  },
  "timeline": {
    "currentTime": "11:24",
    "myTeamName": "A팀",
    "next": null,  // 시간 미정 시 null
    "schedule": []
  },
  "lastUpdated": "2026-05-10T02:24:32Z"
}
```

서버 집계 SQL (개념):

```sql
-- 부문별 전체 갯수
WITH category_totals AS (
  SELECT 
    CASE gc.grade
      WHEN 'red' THEN 'advanced'
      WHEN 'blue' THEN 'intermediate'
      WHEN 'green' THEN 'beginner'
    END AS category,
    SUM(gc.total_count) AS total
  FROM grade_counts gc
  JOIN walls w ON w.id = gc.wall_id AND w.active
  JOIN gyms g ON g.id = w.gym_id AND g.active
  GROUP BY gc.grade
),
participant_solves AS (
  SELECT 
    p.id, p.display_name, p.category, p.participant_type,
    COALESCE(SUM(s.solved_count), 0) AS total_solved
  FROM participants p
  LEFT JOIN solves s ON s.participant_id = p.id
  WHERE p.paid = true  -- 입금자만 순위 포함
  GROUP BY p.id
)
SELECT 
  ps.id, ps.display_name, ps.category, ps.participant_type,
  ps.total_solved,
  ct.total AS total_available,
  CASE WHEN ct.total > 0 THEN ps.total_solved::float / ct.total ELSE 0 END AS ratio
FROM participant_solves ps
JOIN category_totals ct ON ct.category = ps.category
ORDER BY ratio DESC;
```

순위는 서버에서 계산 (클라이언트에서 매번 계산 비효율).

캐싱: 메모리 캐시 5초 (피크 시 50명 × 30초 폴링 = 분당 100 요청 → 부하 분산).

---

## 4. 어드민 API

모든 어드민 API는 `requireAdmin()` 가드 통과 필수.

### `POST /api/admin/walls`
벽 추가.

```json
{
  "gymId": "uuid",
  "name": "3번벽",
  "displayOrder": 3
}
```

### `PATCH /api/admin/walls/:id`
벽 수정 (이름, 활성화 여부).

```json
{
  "name": "3번벽 (변경)",
  "active": true,
  "displayOrder": 3
}
```

### `PATCH /api/admin/grade-counts`
갯수 일괄 수정.

```json
{
  "updates": [
    { "wallId": "uuid", "grade": "red", "totalCount": 5 },
    { "wallId": "uuid", "grade": "blue", "totalCount": 3 }
  ]
}
```

### `PATCH /api/admin/contest-settings`
대회 설정 부분 수정.

```json
{
  "startTime": "09:30",
  "endTime": "16:50",
  "lunchStartTime": "12:30",
  "notice": "양재점 60분으로 연장합니다"
}
```

### `PATCH /api/admin/gym-durations/:gymId`
지점별 체류 시간.

```json
{
  "durationMinutes": 60
}
```

### `GET /api/admin/participants`
참가자 목록.

```json
{
  "participants": [
    {
      "id": "uuid",
      "displayName": "레고",
      "kakaoNickname": "Lego",
      "mainGrade": "pink",
      "category": "advanced",
      "participantType": "crew",
      "paid": false,
      "userId": "uuid",
      "userRole": "admin",
      "team": { "id": "uuid", "name": "A팀" }
    }
  ]
}
```

### `PATCH /api/admin/participants/:id`
참가자 수정.

```json
{
  "displayName": "...",
  "mainGrade": "pink",
  "category": "intermediate",
  "paid": true
}
```

### `PATCH /api/admin/users/:id/role`
어드민 권한 부여/회수.

```json
{
  "role": "admin"  // 또는 "participant"
}
```

### `POST /api/admin/teams`
팀 생성.

```json
{
  "name": "A팀",
  "startWallAssignments": [...]
}
```

### `PATCH /api/admin/teams/:id`
팀 수정 (이름, 멤버, 시작벽).

```json
{
  "name": "A팀",
  "memberIds": ["uuid1", "uuid2", ...],
  "startWallAssignments": [
    { "gymId": "uuid-신사", "wallId": "uuid-1번벽" }
  ]
}
```

### `GET /api/admin/results`
최종 결과 집계 (대시보드와 비슷하지만 입금 안 한 사람도 포함, 표시용).

### `GET /api/admin/results.csv`
CSV 다운로드.

```csv
순위,이름,카테고리,크루/게스트,푼갯수,전체갯수,비율
1,김XX,상급,크루,45,90,50.0%
2,박XX,상급,게스트,40,90,44.4%
```

---

## 5. 권한 매트릭스

| 엔드포인트 | 비로그인 | 참가자(미신청) | 참가자(신청) | 어드민 |
|---|---|---|---|---|
| `GET /api/contest/settings` | ✓ | ✓ | ✓ | ✓ |
| `GET /api/users/me` | ❌ | ✓ | ✓ | ✓ |
| `POST /api/participants` | ❌ | ✓ | ❌ (409) | ✓ |
| `GET /api/participants/me` | ❌ | ❌ (404) | ✓ | ✓ |
| `GET /api/walls` | ❌ | ❌ | ✓ | ✓ |
| `GET /api/solves/me` | ❌ | ❌ | ✓ | ✓ |
| `PUT /api/solves` | ❌ | ❌ | ✓ | ✓ |
| `GET /api/dashboard` | ❌ | ❌ | ✓ | ✓ |
| `* /api/admin/*` | ❌ | ❌ | ❌ | ✓ |

---

## 6. 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # 서버 사이드 전용

# next-auth
AUTH_SECRET=xxx  # openssl rand -base64 32
AUTH_URL=http://localhost:3000  # 배포 시 https://...

# 카카오
KAKAO_CLIENT_ID=xxx  # 카카오 디벨로퍼 콘솔의 REST API 키
KAKAO_CLIENT_SECRET=xxx
```

---

## 7. 마이그레이션 전략

### 초기 (Migration 0001)
- 모든 테이블 생성
- 6개 지점 시드
- contest_settings 단일 행 시드
- gym_durations 시드 (6개)

### 운영 중 변경 가능 (어드민 UI로)
- 벽 추가/수정/비활성
- 갯수 변경
- 텍스트 정의 변경
- 시간 조정
- 참가자 권한 변경

### 절대 변경 X
- 카테고리 enum 값 (코드 변경 필요)
- 그레이드 색깔 코드 (디자인 시스템)

---

## 8. 데이터 무결성 규칙

- 벽 비활성화: `walls.active = false` (soft delete). 기존 `solves`는 보존
- 갯수 0 변경: 해당 벽 × 그레이드는 입력 화면에서 숨김. 기존 solves는 보존
- 참가자 삭제: cascade로 solves, team_members도 삭제
- 카테고리 변경 (어드민이 수정): 기존 solves 보존하되, 새 카테고리에 맞는 grade만 입력 화면에 노출
- 결과 잠금: `contest_settings.results_locked = true` 시 `PUT /api/solves` 거부 (참가자), 어드민은 강제 모드로 가능
