-- 웹앱 DB 함수 5-9 (FS 5-9, PRD 4장 F-15): industry_top_companies(p_limit) — 업종 카드 회사 이름
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.
-- 대상: industry_tree()(5-3)와 같은 범위 (v_search_targets 중 외국회사 제외, division_name 있음)
--       에 v_valuation.mrkt_tot_amt가 있는 회사를 더한 것. 시가총액 없는 회사는 순위에서 뺀다.
-- 순위: 중분류마다 시가총액 desc, 종목명 asc. p_limit은 1~5로 자른다.
-- industry_tree() 반환 모양은 바꾸지 않으려고 별도 RPC로 둔다 (FS 5-9).
-- 보안: security invoker, search_path 고정, anon·authenticated·service_role 실행 (기존 20261121* RPC 형식).

-- =====================================================================
-- 5-9. industry_top_companies(p_limit int default 3)
-- =====================================================================
create or replace function public.industry_top_companies(p_limit int default 3)
returns table (
  division_code  text,
  rank           bigint,
  short_code     text,
  itms_nm        text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
with base as (
  select
    t.division_code,
    t.short_code,
    t.itms_nm,
    v.mrkt_tot_amt
  from public.v_search_targets t
  join public.v_valuation v
    on v.srtn_cd = t.srtn_cd
  where not t.is_foreign
    and t.division_name is not null
    and v.mrkt_tot_amt is not null
),
ranked as (
  select
    b.division_code,
    b.short_code,
    b.itms_nm,
    row_number() over (
      partition by b.division_code
      order by b.mrkt_tot_amt desc, b.itms_nm asc
    ) as rn
  from base b
)
select
  r.division_code,
  r.rn as rank,
  r.short_code,
  r.itms_nm
from ranked r
where r.rn <= least(greatest(coalesce(p_limit, 3), 1), 5)
order by r.division_code, r.rn;
$$;

revoke execute on function public.industry_top_companies(int) from public;
grant execute on function public.industry_top_companies(int) to anon, authenticated, service_role;
