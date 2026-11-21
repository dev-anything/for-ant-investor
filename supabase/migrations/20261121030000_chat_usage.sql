-- 웹앱 DB 함수 5-6 (FS 5-6, PRD 5-7): F-10 챗봇 하루 호출 수 상한
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.

-- =====================================================================
-- 5-6-1. chat_usage_daily — 날짜별 챗봇 AI 호출 수 (하루 1행)
-- =====================================================================
-- day 는 UTC 날짜. 정책 없음 → 서버용 키(service_role)만 읽고 쓴다.
create table public.chat_usage_daily (
  day   date primary key,
  calls int  not null default 0
);

alter table public.chat_usage_daily enable row level security;   -- 정책 없음 → 서버용 키만
revoke all on public.chat_usage_daily from anon, authenticated;

-- =====================================================================
-- 5-6-2. chat_usage_take(p_limit) — 오늘 호출 수 1 증가, 상한 넘으면 false
-- =====================================================================
-- 한 문장 upsert: 행이 돌아오면 허용(true), 상한(calls < p_limit 불만족)이면 행이 안 돌아와 false.
-- 같은 날짜 행은 on conflict 가 잠가서 동시 요청이 와도 상한을 넘지 않는다.
-- p_limit < 1 은 새 행 삽입 경로에서 상한을 못 막으므로 먼저 거른다.
-- 보안: security invoker (RLS 켬·정책 없음이라 service_role 만 실제로 통과), search_path 고정.
-- 실행 권한: service_role 만 (FS 5-6, 5장 공통 규칙의 예외).
create or replace function public.chat_usage_take(p_limit int)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_calls int;
begin
  if p_limit is null or p_limit < 1 then
    return false;
  end if;

  insert into public.chat_usage_daily as u (day, calls)
  values ((now() at time zone 'utc')::date, 1)
  on conflict (day) do update
    set calls = u.calls + 1
    where u.calls < p_limit
  returning u.calls into v_calls;

  return found;
end;
$$;

revoke all on function public.chat_usage_take(int) from public, anon, authenticated;
grant execute on function public.chat_usage_take(int) to service_role;
