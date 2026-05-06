-- 0008: 참가자 상단 공지 메타데이터
--
-- 변경 요지
-- - contest_settings.notice 컬럼은 0001부터 존재했으나 어디서도 사용되지
--   않고 있었음. 이번에 "참가자 화면 상단 sticky 공지" 용도로 정식 채택한다.
-- - 사용자가 공지를 닫았는지 추적하기 위해 notice_updated_at 메타데이터를
--   추가한다. 어드민이 공지를 갱신할 때마다 now()로 찍어두면, 클라이언트는
--   localStorage에 마지막으로 닫은 시각을 저장해 그 이후 갱신된 공지는
--   다시 노출할 수 있다.

alter table contest_settings
  add column if not exists notice_updated_at timestamptz;
