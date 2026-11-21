-- 웹앱 DB 함수 5-8 (FS 5-8, PRD F-13): notification_recipients() — 알림 메일 배치용
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.

-- =====================================================================
-- 5-8-1. notification_recipients() — 메일 받을 사용자 목록
-- =====================================================================
-- 이메일은 auth.users 에만 있으므로 배치가 Auth 관리자 API 대신 이 함수로 읽는다.
-- 조건: 수신 동의(email_opt_in) 이고, 아직 메일로 안 나간 알림(emailed_at is null)이 1개 이상인 사용자.
-- 이메일이 없는 계정(전화 가입 등)은 제외한다.
-- 최근 7일 필터·알림 묶기는 배치(batch/notify_mail.py)가 한다 (FS 9-13).
-- 보안: security definer (auth.users 를 RLS 없이 읽기 위해), search_path 고정.
-- 실행 권한: service_role 만 (FS 5-8).
create or replace function public.notification_recipients()
returns table (
  user_id           uuid,
  email             text,
  unsubscribe_token uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    us.user_id,
    au.email::text as email,
    us.unsubscribe_token
  from public.user_settings us
  join auth.users au
    on au.id = us.user_id
  where us.email_opt_in
    and au.email is not null
    and exists (
      select 1
      from public.notifications n
      where n.user_id = us.user_id
        and n.emailed_at is null
    );
$$;

revoke all on function public.notification_recipients() from public, anon, authenticated;
grant execute on function public.notification_recipients() to service_role;
