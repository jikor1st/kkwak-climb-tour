-- 0003: 참가 신청 안내 문구
-- 신청 직전 확인 다이얼로그에 표시되는 안내. (입금 계좌·진행 절차 등 자유 텍스트)
alter table contest_settings
  add column if not exists signup_notice text not null default '';
