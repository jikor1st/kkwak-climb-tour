-- 0007: 계좌 정보 컬럼 제거
--
-- 변경 요지
-- - 카카오페이 송금 링크가 본인이 초기화하지 않는 한 만료 없이 영구로 동작함을
--   확인. 계좌 정보(은행/계좌번호/예금주)를 fallback으로 유지할 명분이 약해져
--   결제 안내를 카카오페이 단일 채널로 단순화.
-- - 0005에서 추가했던 bank_name/account_number/account_holder 컬럼 드롭.
--   if exists로 컬럼이 없는 환경에서도 안전.

alter table contest_settings
  drop column if exists bank_name,
  drop column if exists account_number,
  drop column if exists account_holder;
