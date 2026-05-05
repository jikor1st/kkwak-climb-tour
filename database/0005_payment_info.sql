-- 0005: 입금·결제 안내 구조화
--
-- 변경 요지
-- - signup_notice 한 줄짜리 free-text 한 칸 → 핵심 결제 정보를 어드민에서
--   구조화해서 입력할 수 있게 컬럼 분리
-- - 참가자 화면(대시보드/잠금화면/신청 확인 다이얼로그)에서는 동일한
--   PaymentInfoCard로 일관되게 노출
--
-- 기존 데이터
-- - signup_notice는 그대로 유지 ("추가 안내" 자유 텍스트)
-- - entry_fee는 이전 마이그레이션에서 이미 존재 (어드민 입력 UI만 신설)

alter table contest_settings
  add column if not exists bank_name text not null default '',
  add column if not exists account_number text not null default '',
  add column if not exists account_holder text not null default '',
  add column if not exists kakaopay_link text not null default '',
  add column if not exists toss_link text not null default '';

comment on column contest_settings.bank_name is '은행명 (예: 카카오뱅크)';
comment on column contest_settings.account_number is '계좌번호';
comment on column contest_settings.account_holder is '예금주';
comment on column contest_settings.kakaopay_link is '카카오페이 송금 코드/QR 링크 (https://qr.kakaopay.com/... 또는 https://kakaopay.me/...)';
comment on column contest_settings.toss_link is '토스 송금 링크 (https://toss.me/{id})';
