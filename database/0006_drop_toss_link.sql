-- 0006: toss_link 컬럼 제거
--
-- 변경 요지
-- - 토스 송금 링크 노출을 빼기로 결정 (카카오페이 링크만 유지)
-- - 0005에서 추가했던 toss_link 컬럼을 드롭. 컬럼이 없는 환경에서도 안전하게
--   동작하도록 if exists 사용.

alter table contest_settings
  drop column if exists toss_link;
