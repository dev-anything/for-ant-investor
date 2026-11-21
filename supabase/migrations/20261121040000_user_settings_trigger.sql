-- 웹앱 DB 트리거 5-7 (FS 5-7, PRD F-11): 회원 가입 시 user_settings 행 자동 생성
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.

-- =====================================================================
-- 5-7-1. handle_new_user() — auth.users 에 사용자가 생기면 user_settings 행을 만든다
-- =====================================================================
-- security definer: auth 스키마 트리거에서 public.user_settings 에 RLS 없이 넣어야 하므로 소유자 권한으로 실행.
-- 이미 행이 있으면 무시 (on conflict do nothing). unsubscribe_token 은 테이블 기본값이 만든다.
-- search_path 고정: 정의자 권한 함수라 '' 로 두고 모든 이름을 스키마 한정으로 쓴다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    insert into public.user_settings (user_id)
    values (new.id)
    on conflict do nothing;
  exception when others then
    -- 설정 행을 못 만들어도 가입 자체는 실패시키지 않는다 (2026-11-21 사용자 결정).
    -- 빠진 행은 앱이 설정을 읽을 때 없음으로 처리하고, 이 경고로 원인을 찾는다.
    raise warning 'handle_new_user: user_settings insert failed (%)', sqlstate;
  end;
  return new;
end;
$$;

-- 트리거로만 실행한다. 사용자·익명 키가 직접 부를 수 없게 실행 권한을 뺀다.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- =====================================================================
-- 5-7-2. 트리거 — auth.users insert 뒤 행마다 실행
-- =====================================================================
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 5-7-3. 이미 가입한 사용자 보정 (트리거 생기기 전 가입자)
-- =====================================================================
insert into public.user_settings (user_id)
select id from auth.users
on conflict do nothing;
