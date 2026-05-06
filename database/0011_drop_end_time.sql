-- 0011: 종료 시각 컬럼 제거
--
-- 변경 요지
-- - 종료 시각은 시작 + 지점별 체류시간 + 휴식 블록의 합으로 항상 도출 가능.
--   수동 입력 필드를 별도로 유지하면 타임라인 변경 시 동기화 누락 위험만
--   생기므로 단일 진실(buildTimeline → endLabel)로 일원화.
-- - 안내문에 라운딩된 종료 시각이 필요하면 마지막에 break stop(예: "정리 10분")을
--   추가하면 타임라인이 그대로 반영.

alter table contest_settings
  drop column if exists end_time;
