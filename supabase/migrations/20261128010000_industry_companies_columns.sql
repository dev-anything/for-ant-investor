-- 웹앱 DB 함수 5-4 변경 (사용자 추가 지시 2026-11-28): 업종 회사 목록 표에 주가·PER·PBR·매출액·영업이익 열 추가
-- 반환 열이 바뀌므로 create or replace가 안 된다. drop function 뒤 같은 인자로 다시 만든다.
-- 기존 검증·대상 회사·정렬 방식(null 맨 뒤, itms_nm → srtn_cd)·보안은 20261121020000과 같다.
-- 적용은 사용자 확인 뒤에만 한다 (이 파일은 작성만).

drop function if exists public.industry_companies(text, text, text, int, int);

create function public.industry_companies(
  p_division text,
  p_sort     text,
  p_dir      text,
  p_page     int,
  p_size     int
)
returns table (
  total_count      bigint,
  srtn_cd          text,
  short_code       text,
  itms_nm          text,
  mrkt_ctg         text,
  acc_mt           text,
  mrkt_tot_amt     bigint,
  bas_dt           date,
  -- 새 열: clpr는 v_valuation.clpr(bigint), per·pbr은 numeric
  clpr             bigint,
  per              numeric,
  pbr              numeric,
  -- v_company_years의 is_latest 행 (컬럼 타입을 뷰와 맞춘다: smallint·bigint)
  fiscal_year      smallint,
  revenue          bigint,
  operating_income bigint,
  is_financial     boolean
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  -- 입력 검증 (FS 5-4). 정렬 키에 per·pbr·revenue·operating_income을 더한다.
  if p_division is null or p_division !~ '^[0-9]{2}$' then
    raise exception 'industry_companies: p_division must be 2 digits' using errcode = '22023';
  end if;
  if p_sort is null or p_sort not in ('name', 'market_cap', 'per', 'pbr', 'revenue', 'operating_income') then
    raise exception 'industry_companies: invalid p_sort' using errcode = '22023';
  end if;
  if p_dir is null or p_dir not in ('asc', 'desc') then
    raise exception 'industry_companies: invalid p_dir' using errcode = '22023';
  end if;
  if p_size is null or p_size not in (10, 20, 50) then
    raise exception 'industry_companies: invalid p_size' using errcode = '22023';
  end if;
  if p_page is null or p_page < 1 then
    raise exception 'industry_companies: p_page must be 1 or more' using errcode = '22023';
  end if;

  return query
  with base as (
    select
      t.srtn_cd,
      t.short_code,
      t.itms_nm,
      t.mrkt_ctg,
      t.acc_mt,
      v.mrkt_tot_amt,
      v.bas_dt,
      v.clpr,
      v.per,
      v.pbr,
      ly.fiscal_year,
      ly.revenue,
      ly.operating_income,
      cs.is_financial,
      case when p_sort = 'market_cap'       then v.mrkt_tot_amt::numeric
           when p_sort = 'per'              then v.per
           when p_sort = 'pbr'              then v.pbr
           when p_sort = 'revenue'          then ly.revenue::numeric
           when p_sort = 'operating_income' then ly.operating_income::numeric
      end as sort_num,
      case when p_sort = 'name' then t.itms_nm end as sort_text
    from public.v_search_targets t
    left join public.v_valuation v on v.srtn_cd = t.srtn_cd
    left join public.company_summary cs on cs.corp_code = t.corp_code
    left join public.v_company_years ly on ly.corp_code = t.corp_code and ly.is_latest
    where not t.is_foreign
      and t.division_name is not null
      and t.division_code = p_division
  ),
  ranked as (
    select
      b.*,
      count(*) over () as total_count,
      row_number() over (
        order by
          case when p_dir = 'asc'  then b.sort_text end asc  nulls last,
          case when p_dir = 'desc' then b.sort_text end desc nulls last,
          case when p_dir = 'asc'  then b.sort_num  end asc  nulls last,
          case when p_dir = 'desc' then b.sort_num  end desc nulls last,
          b.itms_nm asc,
          b.srtn_cd asc
      ) as rn
    from base b
  )
  select
    r.total_count,
    r.srtn_cd,
    r.short_code,
    r.itms_nm,
    r.mrkt_ctg,
    r.acc_mt,
    r.mrkt_tot_amt,
    r.bas_dt,
    r.clpr,
    r.per,
    r.pbr,
    r.fiscal_year,
    r.revenue,
    r.operating_income,
    r.is_financial
  from ranked r
  where r.rn > (p_page - 1)::bigint * p_size
    and r.rn <= p_page::bigint * p_size
  order by r.rn;
end;
$$;

revoke execute on function public.industry_companies(text, text, text, int, int) from public;
grant execute on function public.industry_companies(text, text, text, int, int) to anon, authenticated, service_role;
