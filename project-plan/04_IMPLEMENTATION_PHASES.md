# 단계별 구현 계획

## 전체 흐름 (5월 10일 D-Day 역산)

```
[D-21] Phase 1: 인프라 셋업          ← 가장 먼저
[D-14] Phase 2: 참가 신청 흐름       ← 신청 받기 시작
[D-9]  Phase 3: 풀이 기록 + 대시보드 ← 핵심 사용 흐름
[D-5]  Phase 4: 어드민 모드          ← 운영진 사용
[D-2]  Phase 5: 데이터 입력 + QA     ← 마지막 점검
[D-Day] 대회 진행
[D+1]  결과 정산
```

각 Phase는 **독립적으로 검증 가능한 단위**입니다. Phase가 끝날 때마다 누나/크루원 1명에게 테스트 받고 다음 단계 진입.

---

## Phase 1. 인프라 셋업

### 목표

`npm run dev`로 로컬에서:
- 카카오 로그인 동작
- Supabase에 데이터 저장 확인
- 기본 페이지 렌더링

### 작업 항목

1. **프로젝트 초기화**
   ```bash
   npx create-next-app@latest kkwak-climb-tour \
     --typescript --tailwind --app --src-dir --eslint
   cd kkwak-climb-tour
   npm install zustand react-hook-form zod @hookform/resolvers
   npm install next-auth@beta @auth/core
   npm install @supabase/supabase-js
   ```

2. **디렉토리 구조 생성** (`02_FEATURE_SPEC.md` 참고)

3. **Supabase 프로젝트 생성**
   - https://supabase.com 가입
   - 새 프로젝트 (서울 리전)
   - SQL Editor에서 `0001_initial.sql` 실행 (`03_DATA_MODEL.md` 참고)

4. **카카오 디벨로퍼 콘솔 설정**
   - https://developers.kakao.com 가입
   - 앱 생성 → 카카오 로그인 활성화
   - Redirect URI: `http://localhost:3000/api/auth/callback/kakao`
   - 동의 항목: 닉네임 (필수)
   - REST API 키 → `KAKAO_CLIENT_ID`
   - Client Secret 발급 → `KAKAO_CLIENT_SECRET`

5. **환경 변수 설정** (`.env.local`)

6. **next-auth 설정**
   - `src/lib/auth/auth.ts`
   - 카카오 Provider
   - signIn 콜백에서 `users` upsert
   - session 콜백에서 user 정보 부착

7. **권한 가드 유틸**
   - `src/lib/auth/guards.ts`
   - `requireAuth()`, `requireAdmin()`, `getAuthOrUnauthorized()`

8. **Supabase 클라이언트**
   - `src/lib/supabase/server.ts` (Service Role Key)
   - `src/lib/supabase/client.ts` (Anon Key)

9. **미들웨어**
   - `src/middleware.ts`
   - 보호 경로: `/signup`, `/input`, `/dashboard`, `/admin/*`
   - 비로그인 시 `/login` 리다이렉트

10. **랜딩 페이지 정적 이식**
    - 프로토타입 HTML → `src/app/(public)/page.tsx`로 JSX 이식
    - 디자인 토큰은 `tailwind.config.ts`로 추출 (`05_DESIGN_SYSTEM.md` 참고)

11. **로그인 페이지**
    - `/login` 페이지 + "카카오로 시작하기" 버튼

### 검증 체크리스트

- [ ] `npm run dev` 정상 동작
- [ ] `/` (랜딩) 렌더링 OK
- [ ] `/login` → 카카오 로그인 → 콜백 → 홈 리다이렉트
- [ ] Supabase `users` 테이블에 새 사용자 추가됨
- [ ] 로그아웃 동작
- [ ] 보호 경로 비로그인 시 `/login` 리다이렉트
- [ ] 어드민 권한 부여 방법 README에 명시 (Supabase 콘솔에서 직접 `users.role = 'admin'`)

### 산출물

- 작동하는 Next.js 프로젝트
- Supabase에 모든 테이블 + 시드 데이터
- 카카오 로그인 동작
- 랜딩 페이지 (정적)
- README (로컬 실행 방법)

---

## Phase 2. 참가 신청 흐름

### 목표

로그인한 사용자가 참가 신청 → 완료 페이지까지의 전체 흐름.

### 작업 항목

1. **API: 대회 설정 조회**
   - `GET /api/contest/settings`
   - 텍스트 정의 (핑크 가이드 등) 클라이언트로 전달

2. **API: 참가 신청**
   - `POST /api/participants`
   - Zod 검증 + 비즈니스 검증 + insert

3. **API: 내 신청 정보**
   - `GET /api/participants/me`
   - 404면 `/signup`, 있으면 `/signup/complete` 라우팅 결정

4. **참가 신청 페이지** (`/signup`)
   - 이름 입력
   - 평소 푸는 색 (그레이드 카드 3개)
   - 카테고리 선택 (그레이드에 따라 다르게)
   - 핑크/빨강일 때 가이드 박스 표시
   - 매핑 미리보기 (실시간)
   - 참가 유형
   - 약관 동의
   - 하단 sticky CTA

5. **신청 완료 페이지** (`/signup/complete`)
   - 본인 정보 표시
   - 다음 단계 안내 (입금 → 팀 배정)
   - 입금 계좌 정보 (contest_settings에 저장)

6. **로그인 후 자동 라우팅 로직**
   - 신청 안 함 → `/signup`
   - 신청함 → `/signup/complete` 또는 `/dashboard`

### 검증 체크리스트

- [ ] 보라 선택 시 카테고리 자동 고정
- [ ] 핑크 선택 시 카테고리 2개 + 가이드 표시
- [ ] 빨강 선택 시 카테고리 2개 + 가이드 표시
- [ ] 약관 미동의 시 제출 비활성
- [ ] 신청 후 DB에 레코드 추가 확인
- [ ] 이미 신청한 사용자가 `/signup` 접근 시 자동 리다이렉트
- [ ] 매핑 미리보기 정확
- [ ] 모바일 360px에서 폼 입력 자연스러움

### 산출물

- 신청 가능한 폼
- 신청 완료 페이지
- 누나에게 공유 → 5명 정도 테스트 신청 받기

---

## Phase 3. 풀이 기록 + 대시보드

### 목표

참가자가 풀이를 입력하고 본인/타인 순위를 볼 수 있는 핵심 흐름.

### 작업 항목

1. **API: 지점/벽/갯수**
   - `GET /api/walls`
   - 본인 카테고리에 해당하는 그레이드만 반환

2. **API: 풀이 기록 조회/입력**
   - `GET /api/solves/me`
   - `PUT /api/solves`

3. **풀이 기록 페이지** (`/input`)
   - 상단 sticky 본인 정보 + 진행 바
   - 시간표 위젯
   - 지점 탭 (가로 스크롤)
   - 벽 카드 + 카운터 (+/-, 직접입력)
   - 자동 저장 (300ms debounce)

4. **API: 대시보드**
   - `GET /api/dashboard`
   - 순위 계산 (서버 사이드)
   - 5초 메모리 캐시

5. **대시보드 페이지** (`/dashboard`)
   - 공지 배너 (notice 있을 때만)
   - 본인 카드 (Hero)
   - 시간표 위젯
   - 카테고리 탭 (상급 / 중급 / 초급)
   - 순위 리스트 (본인 강조 + 메달)
   - 30초 폴링

6. **상태 관리** (Zustand)
   - `inputStore`: 풀이 데이터, 선택된 지점
   - `dashboardStore`: 대시보드 데이터, 마지막 갱신

### 검증 체크리스트

- [ ] 본인 카테고리에 맞는 그레이드만 입력 칸 표시
- [ ] 갯수 입력 시 300ms 후 자동 저장
- [ ] 새로고침 후 입력값 유지
- [ ] 전체 갯수 초과 시 차단
- [ ] 진행 바 / 비율 즉시 반영
- [ ] 대시보드 30초 자동 갱신
- [ ] 페이지 비활성 시 폴링 중단
- [ ] 본인 행 시각적 강조
- [ ] 동률 시 공동 순위 표시

### 산출물

- 작동하는 풀이 입력 화면
- 작동하는 대시보드
- 어드민이 수동으로 지점/벽/갯수를 Supabase 콘솔에서 입력해서 테스트 가능

---

## Phase 4. 어드민 모드

### 목표

운영진이 사전 준비 + 당일 운영을 할 수 있는 모든 기능.

### 작업 항목

1. **어드민 모드 토글**
   - 헤더에 "어드민 모드" 토글 (role=admin만)
   - `localStorage` 저장
   - Zustand `adminModeStore`

2. **어드민 메뉴**
   - 토글 ON 시 헤더에 드롭다운 또는 사이드바
   - 7개 항목 (지점/시간/설정/참가자/팀/결과/공지)

3. **지점/벽 관리** (`/admin/walls`)
   - 지점 탭
   - 벽 추가/수정/비활성화
   - 그레이드별 갯수 입력 (red/blue/green 동시)

4. **시간 조정** (`/admin/time`)
   - 대회 메타 시간 편집
   - 지점별 체류 시간
   - 시간표 미리보기

5. **대회 설정** (`/admin/settings`)
   - 모든 텍스트 편집
   - 공지 입력

6. **참가자 관리** (`/admin/participants`)
   - 검색/필터
   - 입금 토글
   - 권한 변경
   - 정보 수정

7. **팀 관리** (`/admin/teams`)
   - 팀 CRUD
   - 멤버 배정 (드래그앤드롭 또는 select)
   - 시작 벽 지정

8. **결과 집계** (`/admin/results`)
   - 부문별 최종 순위
   - CSV 다운로드
   - 결과 잠금 토글

### 검증 체크리스트

- [ ] 일반 참가자가 `/admin/*` 접근 시 홈 리다이렉트
- [ ] 어드민 토글 ON/OFF 정상 동작
- [ ] 벽 추가/수정/비활성화 즉시 반영
- [ ] 갯수 변경이 참가자 화면에 반영 (다음 폴링)
- [ ] 시간 변경 즉시 반영
- [ ] 공지 입력 즉시 반영
- [ ] 참가자 입금 토글
- [ ] 팀 편성 가능
- [ ] CSV 다운로드 동작

### 산출물

- 모든 어드민 기능
- 운영진이 자체적으로 데이터 입력 가능

---

## Phase 5. 데이터 입력 + QA

### 목표

대회 진행에 필요한 실제 데이터 입력 + 전체 흐름 QA.

### 작업 항목

1. **운영진의 6개 지점 정찰**
   - 각 지점 방문 (또는 사전 정보 수집)
   - 벽 이름 + 빨강/파랑/초록 갯수 정확히 파악
   - 어드민 페이지에서 입력

2. **참가자 입금 확인**
   - 참가비 입금 받기
   - 어드민에서 `paid = true` 토글
   - 입금 안 한 사람은 순위에 미포함

3. **팀 편성**
   - 카테고리 균형 + 친한 사람들 묶기
   - 각 지점별 시작 벽 분산 배정

4. **시간 확정 (D-1)**
   - 시작/종료/점심 시간 입력
   - 카카오톡으로 안내

5. **End-to-End 테스트**
   - 신규 사용자 시나리오 (회원가입 → 신청 → 풀이 → 대시보드)
   - 어드민 시나리오 (갯수 변경 → 공지 → 결과 집계)
   - 모바일 환경 (실제 폰)
   - 약한 통신 (3G throttling)

6. **배포**
   - Vercel 연동 (GitHub repo)
   - 환경 변수 설정 (production)
   - 카카오 콘솔에 production redirect URI 추가
   - Supabase 무료 플랜 한도 모니터링

### 검증 체크리스트

- [ ] 6개 지점 모든 벽의 갯수 정확
- [ ] 참가자 명단 + 입금 상태 정확
- [ ] 팀 + 시작 벽 모두 배정
- [ ] 시간표 확정
- [ ] 모바일 실기기 테스트 OK
- [ ] 동시 50명 시뮬레이션 (스크립트 또는 친구들 동원)
- [ ] 대회 당일 운영 매뉴얼 작성

### 산출물

- 대회 진행 가능한 상태
- 운영 매뉴얼 (체크리스트)

---

## 기술 스택 / 의존성 정리

### 핵심
- `next@14`
- `react@18`
- `typescript`
- `tailwindcss`
- `next-auth@beta` (Auth.js v5)
- `@supabase/supabase-js`

### 폼 / 검증
- `react-hook-form`
- `zod`
- `@hookform/resolvers`

### 상태
- `zustand`

### 유틸
- `clsx` 또는 `tailwind-merge`
- `date-fns` (시간 계산용)

### 개발
- `eslint`
- `prettier`
- `@types/*`

---

## 배포 환경

### Vercel (Frontend + API Routes)
- 무료 플랜
- GitHub 연동 자동 배포
- 환경 변수 설정 필수

### Supabase (DB + Auth)
- 무료 플랜 (500MB DB, 5GB 대역폭/월, 50,000 monthly active users)
- 이번 규모(50명, 1일)에 충분
- Direct connection 또는 Pooler 사용

### 도메인
- Vercel 무료 도메인 (`kkwak-climb-tour.vercel.app`)
- 또는 커스텀 도메인 (선택)

---

## 위험 / 주의사항

### 카카오 OAuth 검수

- 카카오 비즈니스 계정 등록 시 검수 필요할 수 있음
- 미리 신청해서 시간 확보 (D-30 권장)
- 검수 안 받으면 동의 항목 일부 제한될 수 있음 (닉네임만 받으면 OK)

### Supabase 무료 플랜

- 7일 비활성 시 프로젝트 일시정지 → 깨우는데 시간 소요
- 대회 일주일 전부터는 매일 한 번씩 호출해서 활성 유지

### Vercel 무료 플랜

- 서버리스 함수 10초 timeout (대시보드 집계 빨라야 함)
- 일일 100GB 대역폭 (50명 규모면 충분)

### 모바일 통신

- 더클라임 지하층 통신 약함 → 자동 저장 실패 시 재시도 필수
- iOS Safari에서 fetch 캐싱 이슈 → no-cache 헤더 필수

### 시간 변경 알림

- 시간 변경 시 자동 알림 X
- 카카오톡으로 별도 안내 + 대시보드 공지 배너

---

## 구현 시작 시 첫 명령어

```bash
# 1. 프로젝트 생성
npx create-next-app@latest kkwak-climb-tour \
  --typescript --tailwind --app --src-dir --eslint --use-npm

cd kkwak-climb-tour

# 2. 의존성 설치
npm install next-auth@beta @auth/core
npm install @supabase/supabase-js
npm install zustand react-hook-form zod @hookform/resolvers
npm install -D @types/node

# 3. .env.local 생성 (위 환경 변수 참고)

# 4. Supabase 마이그레이션 실행 (콘솔에서 SQL 직접 실행)

# 5. Phase 1 작업 시작
```
