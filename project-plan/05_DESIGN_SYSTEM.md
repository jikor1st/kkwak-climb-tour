# 디자인 시스템

> 프로토타입(`prototype_reference.html`)에서 추출한 디자인 토큰과 컴포넌트 가이드입니다. Next.js 구현 시 그대로 가져다 쓰면 됩니다.

## 디자인 원칙

1. **밝고 따뜻한 톤** — 다크 배경 X. 장시간 봐도 눈 편한 오프화이트 베이스.
2. **빨강 포인트 절제** — 빨강은 진짜 중요한 곳(CTA, 본인 강조, 핵심 숫자)에만.
3. **그레이드 색깔은 의미를 담음** — 색깔별 시각 정체성 살리되, 색깔 + 텍스트 라벨 같이 사용.
4. **모바일 우선** — 모든 터치 영역 ≥ 44px, 한 손 도달 가능.
5. **여백 넉넉** — 정보 밀도보다 가독성 우선.

---

## 컬러 토큰

### 배경 / 표면

```css
--paper:   #FAFAF7   /* 메인 배경 (따뜻한 오프화이트) */
--surface: #FFFFFF   /* 카드 배경 */
--mute:    #F4F2ED   /* 보조 배경 (강조 안 한 박스, 입력 placeholder 등) */
```

### 텍스트

```css
--ink-900: #0A0A0A   /* 본문 / 제목 */
--ink-700: #3F3F3F   /* 보조 텍스트 */
--ink-500: #6B6B6B   /* 캡션 */
--ink-300: #A1A1A1   /* 비활성 / placeholder */
```

### 라인

```css
--line:         #E7E4DD   /* 기본 경계선 */
--line-strong:  #D4D0C7   /* 강조 경계선 (hover 등) */
```

### 액센트 (빨강)

```css
--accent:      #DC2626   /* 메인 액센트 */
--accent-soft: #FEE2E2   /* 액센트 배경 (본인 강조 등) */
```

### 그레이드 색깔

```css
--grade-white:  #FFFFFF   /* 하양 (테두리 필요) */
--grade-yellow: #EAB308
--grade-orange: #EA580C
--grade-green:  #16A34A
--grade-blue:   #2563EB
--grade-red:    #DC2626   /* === accent와 동일 */
--grade-pink:   #DB2777
--grade-purple: #9333EA
--grade-gray:   #6B7280   /* 회색 */
```

### Tailwind 설정

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        surface: '#FFFFFF',
        mute: '#F4F2ED',
        ink: { 
          900: '#0A0A0A', 
          700: '#3F3F3F', 
          500: '#6B6B6B', 
          300: '#A1A1A1' 
        },
        line: '#E7E4DD',
        lineStrong: '#D4D0C7',
        accent: '#DC2626',
        accentSoft: '#FEE2E2',
        grade: {
          white: '#FFFFFF',
          yellow: '#EAB308',
          orange: '#EA580C',
          green: '#16A34A',
          blue: '#2563EB',
          red: '#DC2626',
          pink: '#DB2777',
          purple: '#9333EA',
          gray: '#6B7280',
        }
      }
    }
  }
}
```

---

## 타이포그래피

### 폰트

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

CDN 로딩:

```html
<link 
  rel="stylesheet" 
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
>
```

또는 npm: `npm install pretendard`

### 굵기

| 굵기 | Tailwind | 용도 |
|---|---|---|
| 400 | `font-normal` | 본문 |
| 500 | `font-medium` | 보조 텍스트 (잘 안 씀) |
| 700 | `font-bold` | 강조 |
| 900 | `font-black` | 제목, 큰 숫자 |

### 크기 위계

| 용도 | 모바일 | 데스크탑 (sm:) |
|---|---|---|
| Hero 제목 | `text-[40px]` `leading-[1.1]` | `text-6xl` `leading-[1.05]` |
| 섹션 제목 | `text-3xl` | `text-4xl` |
| 카드 제목 | `text-xl` | `text-2xl` |
| 본문 | `text-base` (16px) | `text-base` |
| 캡션 | `text-sm` (14px) | `text-sm` |
| 마이크로 카피 | `text-xs` (12px) | `text-xs` |

### 줄간격 / 자간

```css
body { line-height: 1.6; }
p, li { line-height: 1.7; }  /* 본문은 약간 더 넓게 */

h1, h2, h3 { 
  letter-spacing: -0.02em;  /* 큰 제목 자간 약간 좁게 */
}
```

### 숫자 표시 (Tabular)

순위·갯수·시간 같은 숫자는 `tabular-nums`로 정렬:

```css
.num { 
  font-feature-settings: "tnum"; 
  font-variant-numeric: tabular-nums; 
}
```

```html
<span class="num">11:24</span>
<span class="num">27/90</span>
```

---

## 간격 (Spacing)

Tailwind 기본 스케일 사용. 자주 쓰는 패턴:

| 용도 | 클래스 |
|---|---|
| 카드 내부 패딩 | `p-5` (모바일) `sm:p-6` (PC) |
| 큰 카드 패딩 | `p-6` (모바일) `sm:p-8` (PC) |
| 섹션 상하 여백 | `py-12` (모바일) `sm:py-14` (PC) |
| 카드 간격 | `gap-3` 또는 `space-y-3` |
| 페이지 좌우 여백 | `px-5` |
| 최대 너비 | `max-w-3xl` (콘텐츠) `max-w-xl` (폼/입력) |

---

## 모서리 (Radius)

```css
rounded-xl   = 12px   /* 작은 카드, 칩 */
rounded-2xl  = 16px   /* 일반 카드 */
rounded-3xl  = 24px   /* 큰 카드, 히어로 박스 */
rounded-full = 9999px /* 알약, 점, 배지 */
```

---

## 그림자

```css
.shadow-soft {
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.04), 
    0 1px 3px rgba(0,0,0,0.06);
}

.shadow-card {
  box-shadow: 
    0 2px 8px rgba(0,0,0,0.04), 
    0 4px 16px rgba(0,0,0,0.04);
}

.shadow-pop {
  box-shadow: 
    0 4px 12px rgba(220,38,38,0.15), 
    0 8px 24px rgba(220,38,38,0.10);
}
```

용도:
- `shadow-soft`: 일반 카드
- `shadow-card`: 강조 카드 (히어로 등)
- `shadow-pop`: CTA 버튼, 본인 강조

---

## 컴포넌트 가이드

### 1. 그레이드 알약 (Grade Pill)

```tsx
type GradePillProps = {
  grade: 'red' | 'pink' | 'purple' | 'blue' | 'green';
  label: string;
};

function GradePill({ grade, label }: GradePillProps) {
  const colors = {
    red:    { color: '#DC2626', bg: '#FEF2F2' },
    pink:   { color: '#DB2777', bg: '#FDF2F8' },
    purple: { color: '#9333EA', bg: '#FAF5FF' },
    blue:   { color: '#2563EB', bg: '#EFF6FF' },
    green:  { color: '#16A34A', bg: '#F0FDF4' },
  };
  const c = colors[grade];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border-[1.5px]"
      style={{ color: c.color, borderColor: c.color, background: c.bg }}
    >
      <span 
        className="w-2.5 h-2.5 rounded-full" 
        style={{ background: c.color }} 
      />
      {label}
    </span>
  );
}
```

### 2. 카운터 (Counter)

```tsx
type CounterProps = {
  value: number;
  max: number;
  onChange: (n: number) => void;
};

function Counter({ value, max, onChange }: CounterProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="w-14 h-14 rounded-2xl bg-mute hover:bg-line transition flex items-center justify-center text-2xl font-black disabled:opacity-50 active:scale-95"
      >
        −
      </button>
      
      <button 
        onClick={() => promptDirectInput(value, max, onChange)}
        className="flex-1 text-center"
      >
        <div className="text-4xl font-black num leading-none">
          {value}
        </div>
        <div className="text-xs text-ink-500 num mt-1">
          / {max}
        </div>
      </button>
      
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value === max}
        className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent/90 transition flex items-center justify-center text-2xl font-black text-white shadow-pop disabled:opacity-50 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

function promptDirectInput(current: number, max: number, onChange: (n: number) => void) {
  const value = window.prompt(`완등한 갯수를 입력하세요 (0~${max})`, String(current));
  if (value === null) return;
  const n = Math.max(0, Math.min(max, parseInt(value) || 0));
  onChange(n);
}
```

### 3. 버튼

#### Primary (CTA)

```tsx
<button className="px-7 py-4 bg-accent hover:bg-accent/90 transition rounded-xl font-bold text-white text-base shadow-pop active:scale-95">
  참가 신청하기
</button>
```

#### Secondary

```tsx
<button className="px-7 py-4 bg-surface border border-line hover:border-lineStrong transition rounded-xl font-bold text-ink-900 text-base">
  규칙 보기
</button>
```

#### Hidden CTA Bar (모바일 하단 sticky)

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-md border-t border-line p-4 safe-bottom">
  <div className="max-w-xl mx-auto">
    <button className="w-full py-4 bg-accent hover:bg-accent/90 transition rounded-xl font-bold text-white text-base shadow-pop">
      신청 완료
    </button>
  </div>
</div>
```

### 4. 입력 (Input)

```tsx
<input
  type="text"
  placeholder="실명 또는 닉네임"
  className="w-full px-4 py-3.5 bg-surface border border-line rounded-xl text-base focus:border-accent focus:ring-4 focus:ring-accentSoft focus:outline-none transition shadow-soft"
/>
```

### 5. 카드 (선택 카드, 그레이드 옵션 등)

```tsx
// 선택 안 됨
<button className="p-4 rounded-xl bg-surface border-2 border-line hover:border-lineStrong transition shadow-soft">
  ...
</button>

// 선택됨
<button 
  className="p-4 rounded-xl border-2 transition shadow-soft" 
  style={{ background: gradeColor + '10', borderColor: gradeColor }}
>
  ...
</button>
```

### 6. 진행 바

```tsx
<div className="h-2 bg-mute rounded-full overflow-hidden">
  <div 
    className="h-full bg-accent rounded-full transition-all duration-500" 
    style={{ width: `${ratio * 100}%` }}
  />
</div>
```

### 7. 안내 박스 (Notice)

```tsx
// 일반 정보
<div className="bg-mute rounded-xl p-4 text-sm text-ink-700">
  💡 지점별 시간은 당일 혼잡도에 따라 조정될 수 있어요.
</div>

// 경고/필독
<div className="bg-surface border-2 border-accent rounded-2xl p-5 shadow-soft">
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-base font-black">!</div>
    <div className="flex-1">
      <div className="text-xs text-accent uppercase tracking-wider mb-1.5 font-black">필독</div>
      <div className="font-black text-base mb-2">제목</div>
      <p className="text-sm text-ink-700 leading-relaxed">본문</p>
    </div>
  </div>
</div>

// 공지 (노란 톤)
<div className="rounded-2xl p-4 flex items-start gap-3 shadow-soft" 
     style={{ background: '#FEFCE8', border: '1px solid #FDE68A' }}>
  <span className="text-lg shrink-0">📢</span>
  <div className="flex-1">
    <div className="text-xs font-black mb-1" style={{ color: '#A16207' }}>운영진 공지</div>
    <p className="text-sm" style={{ color: '#713F12' }}>...</p>
  </div>
</div>
```

### 8. 순위 항목 (Rank Row)

```tsx
// 일반
<div className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-4 shadow-soft">
  <div className="w-10 text-center">
    <div className="text-2xl font-black num text-ink-700">{rank}</div>
    {rank <= 3 && <div className="text-base">{['🥇','🥈','🥉'][rank-1]}</div>}
  </div>
  <div className="flex-1 min-w-0">
    <div className="font-black text-base truncate">{name}</div>
    <div className="text-xs text-ink-500 num mt-0.5">{solved} / {total}개</div>
  </div>
  <div className="text-right">
    <div className="text-2xl font-black num">{ratio}%</div>
  </div>
</div>

// 본인 강조
<div className="rounded-2xl p-4 flex items-center gap-4 relative shadow-pop"
     style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', border: '2px solid #DC2626' }}>
  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-accent text-white text-[10px] rounded-md font-black">나</div>
  ...
</div>
```

---

## 반응형 브레이크포인트

```css
sm: 640px   /* 모바일 가로 / 작은 태블릿 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크탑 */
```

대부분의 디자인은 `sm:` 분기점만으로 충분합니다.

```html
<!-- 모바일 한 칸, 태블릿+ 두 칸 -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

---

## 모바일 안전 영역 (iOS Notch)

```html
<!-- viewport 설정 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- 하단 sticky bar에 적용 -->
<style>
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0); }
</style>
```

---

## 애니메이션

```css
/* 버튼 탭 피드백 */
button:active { 
  transform: scale(0.96); 
  transition: transform 0.06s; 
}

/* 진행 바 */
.progress { transition: width 0.5s; }

/* 펄스 (배지) */
.animate-pulse { /* Tailwind 기본 */ }
```

페이지 전환 / 큰 애니메이션은 자제. 스포츠 컨셉인 만큼 빠르고 단호한 느낌이 더 어울립니다.

---

## 다크 모드

**MVP 범위 외**. 사용자 베이스가 작고 대회 당일 한 번 쓰는 용도라 ROI 낮음. 향후 추가 가능.

---

## 사용 예시

전체 페이지 구조 예시는 `prototype_reference.html` 참고.

Next.js 구현 시:
1. `tailwind.config.ts`에 위 토큰 그대로 추가
2. `globals.css`에 `body` 기본 스타일 + `.num`, `.shadow-*` 추가
3. 각 컴포넌트는 위 패턴을 컴포넌트 파일로 분리 (`src/components/ui/*`)

---

## 디자인 검증 체크리스트

새 페이지/컴포넌트 만들 때 확인:

- [ ] 모바일 360px에서 깨짐 없음
- [ ] 터치 영역 ≥ 44x44px
- [ ] 텍스트 대비 4.5:1 이상
- [ ] 색깔만으로 정보 전달 X (텍스트 라벨 같이)
- [ ] 숫자는 `tabular-nums` 적용
- [ ] 한 손 조작 가능 (주요 액션 하단)
- [ ] iOS safe-area 대응
- [ ] hover/focus/active 상태 명확
- [ ] 로딩/빈 상태 UI 있음
