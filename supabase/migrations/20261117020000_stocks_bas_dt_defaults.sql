-- 배치 upsert(PostgREST)는 보낸 열만 갱신하지만, 충돌 전 삽입 행에도 NOT NULL이 검사된다.
-- 기존 종목 갱신 때 first_bas_dt를 보내지 않아도 되도록 기본값을 둔다.
alter table public.stocks alter column first_bas_dt set default current_date;
alter table public.stocks alter column last_bas_dt  set default current_date;
