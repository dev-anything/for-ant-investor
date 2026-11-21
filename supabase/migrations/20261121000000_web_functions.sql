-- 웹앱 DB 함수 (FS 5장). 1a: search_stocks (F-01 종목 검색)
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.

-- =====================================================================
-- 5-1. search_stocks(p_q, p_limit) — F-01 연관검색어
-- =====================================================================
-- 검색 규칙 (PRD 4장 F-01):
--  - 입력은 trim 후 1~50자. 빈 값·50자 초과는 0행 (`where` 에서 거른다).
--  - 대소문자·공백을 무시하려고 소문자로 바꾸고 공백을 뺀 값(nq)으로 비교한다.
--    (stocks.search_name과 같은 방식)
--  - nq가 숫자로만 되어 있으면 종목코드 앞부분 일치 (0 완전 / 1 앞부분).
--  - 그 밖에는 종목명(search_name): 0 완전 일치, 1 앞부분, 2 중간 포함.
--    영문자가 섞인 종목코드(0220W0)는 대문자로 바꾼 nq가 short_code와 같으면 0으로 함께 본다.
--  - 정렬: match_rank, itms_nm (DB 기본 collation). 상한은 least(max(p_limit,1), 10).
--  - LIKE 특수문자(\ % _)는 이스케이프한다.
-- 보안: security invoker (밑 뷰·테이블의 RLS를 따름), search_path 고정,
--       실행 권한은 anon·authenticated·service_role (FS 5장 공통).
-- 인덱스: 새로 만들지 않는다. stocks_search_name_trgm(trgm GIN)·stocks_short_code_key 사용.
create or replace function public.search_stocks(p_q text, p_limit int default 10)
returns table (
  srtn_cd     text,
  short_code  text,
  itms_nm     text,
  mrkt_ctg    text,
  is_foreign  boolean,
  match_rank  int
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
with input as (
  select
    lower(regexp_replace(trim(coalesce(p_q, '')), '\s', '', 'g')) as nq,
    length(trim(coalesce(p_q, ''))) as raw_len
),
params as (
  select
    nq,
    -- LIKE 특수문자 이스케이프 (기본 escape 문자는 백슬래시)
    replace(replace(replace(nq, '\', '\\'), '%', '\%'), '_', '\_') as lq,
    upper(nq) as uq,
    nq ~ '^[0-9]+$' as is_numeric
  from input
  where raw_len between 1 and 50
    and nq <> ''
)
select
  t.srtn_cd,
  t.short_code,
  t.itms_nm,
  t.mrkt_ctg,
  t.is_foreign,
  r.match_rank
from params p
cross join public.v_search_targets t
cross join lateral (
  select
    case
      when p.is_numeric then
        case
          when t.short_code = p.nq then 0
          when t.short_code like p.lq || '%' then 1
        end
      else
        case
          when t.search_name = p.nq or t.short_code = p.uq then 0
          when t.search_name like p.lq || '%' then 1
          when t.search_name like '%' || p.lq || '%' then 2
        end
    end as match_rank
) r
where r.match_rank is not null
order by r.match_rank, t.itms_nm
limit least(greatest(coalesce(p_limit, 10), 1), 10);
$$;

-- 실행 권한: FS 5장대로 공개 데이터만 읽으므로 anon·authenticated·service_role에 준다.
-- PUBLIC(기본) 실행 권한은 먼저 거둔다.
revoke execute on function public.search_stocks(text, int) from public;
grant execute on function public.search_stocks(text, int) to anon, authenticated, service_role;
