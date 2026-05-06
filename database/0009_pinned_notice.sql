-- 0009: 고정 공지(안내사항) 컬럼 추가
--
-- 변경 요지
-- - 0008에서 도입한 contest_settings.notice는 사용자가 닫으면 사라지는
--   "핫 공지" 용도로 정착시키고, 닫을 수 없이 항상 노출되는 "고정 공지"는
--   별도 컬럼으로 분리한다.
-- - 두 슬롯이 동시에 노출되며, 운영진은 매번 보여줘야 할 규칙·연락처(고정)와
--   당일 발생하는 일시적 알림(핫)을 따로 관리할 수 있다.
-- - pinned_notice는 닫기 자체가 없으므로 updated_at 메타데이터가 필요 없다.

alter table contest_settings
  add column if not exists pinned_notice text;
