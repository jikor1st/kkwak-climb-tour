# THE CLIMB TOUR 2026

강남권 더클 뿌수기 대회 - 꽉크루 클라이밍 투어 대회 운영 웹앱

## 개발 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일에서 다음 값들을 설정해주세요:

```bash
# Supabase 설정 (https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# next-auth 설정
AUTH_SECRET=your-auth-secret-here  # openssl rand -base64 32로 생성
AUTH_URL=http://localhost:3000

# 카카오 OAuth 설정 (https://developers.kakao.com/console/app)
KAKAO_CLIENT_ID=your-kakao-rest-api-key-here
KAKAO_CLIENT_SECRET=your-kakao-client-secret-here
```

### 2. Supabase 데이터베이스 설정

1. https://supabase.com에서 새 프로젝트 생성 (서울 리전 권장)
2. SQL Editor에서 `database/0001_initial.sql` 파일 내용 실행
3. API 키들을 `.env.local`에 복사

### 3. 카카오 디벨로퍼 콘솔 설정

1. https://developers.kakao.com에서 앱 생성
2. 카카오 로그인 활성화
3. Redirect URI 설정: `http://localhost:3000/api/auth/callback/kakao`
4. 동의 항목: 닉네임 (필수)
5. REST API 키와 Client Secret을 `.env.local`에 복사

### 4. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000에서 확인

### 5. 어드민 권한 부여

첫 번째 사용자가 가입한 후, Supabase 콘솔에서 직접 수정:

```sql
UPDATE users SET role = 'admin' WHERE kakao_id = 'YOUR_KAKAO_ID';
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (public)/           # 비로그인 접근 가능
│   │   ├── page.tsx        # 랜딩 페이지
│   │   └── login/
│   ├── (participant)/      # 로그인 + 참가자
│   │   ├── signup/         # 참가 신청
│   │   ├── input/          # 풀이 기록
│   │   └── dashboard/      # 대시보드
│   ├── (admin)/           # 어드민 전용
│   │   └── admin/         # 어드민 페이지들
│   └── api/               # API 엔드포인트
├── lib/
│   ├── auth/              # 인증 관련
│   └── supabase/          # DB 클라이언트
└── components/            # 재사용 컴포넌트
```

## Phase 1 체크리스트

- [x] Next.js 프로젝트 초기화
- [x] Supabase 데이터베이스 설정
- [x] 카카오 OAuth 설정
- [x] next-auth 구성
- [x] 권한 가드 구현
- [x] 미들웨어 설정
- [x] 랜딩 페이지 구현
- [x] 로그인 페이지 구현
- [ ] 카카오 로그인 테스트
- [ ] 데이터베이스 연결 테스트

## 다음 단계 (Phase 2)

1. 참가 신청 페이지 구현
2. API 엔드포인트 개발
3. 폼 검증 로직
4. 신청 완료 페이지

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: next-auth v5 + Kakao OAuth
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Deployment**: Vercel + Supabase
# kkwak-climb-tour
