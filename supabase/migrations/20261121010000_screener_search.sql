-- 웹앱 DB 함수 5-2 (FS 5장): screener_search — F-07 스크리너 결과 목록
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.
-- 1a 파일(20261121000000_web_functions.sql)과 분리한 이유: 적용 이력을 단계별로 남기려고 (DEV_PLAN 5a).

-- =====================================================================
-- 5-2. screener_search(p_filters, p_sort, p_dir, p_page, p_size) — F-07 결과 목록
-- =====================================================================
-- 대상: v_search_targets(외국회사 제외) ⨝ company_summary, matched_filters @> p_filters.
-- 입력 검증은 함수 안에서 raise exception (FS 5-2 "입력 검증", 앱 쪽 검증과 별개로 한 번 더):
--  - p_filters: 1~3개, 값 1~20, 중복 없음
--  - p_sort: 정렬 키 12개 중 하나 (화이트리스트 — 아래 case 문으로만 정렬 열을 고른다. SQL 주입 방지)
--  - p_dir: asc / desc
--  - p_size: 10 / 20 / 50, p_page: 1 이상
-- 정렬 규칙 (FS 5-2):
--  - 3개년 열은 최근 연도(is_latest 행) 값, dps는 dividends의 가장 최근 연도 dps
--  - null은 방향과 상관없이 맨 뒤 (nulls last). 같은 값은 itms_nm asc (같아도 srtn_cd asc로 순서 고정)
--  - 정렬 값은 sort_num(숫자 키) 또는 sort_text(name 키) 한 열로 모으고, 방향별 order by 항목을 나눠 쓴다
-- 페이지: row_number로 번호를 붙인 뒤 (p_page-1)*p_size < rn <= p_page*p_size 만 가져온다.
--  범위를 넘는 페이지는 0행 (total_count도 없음 → 앱이 0건으로 보고 마지막 페이지로 다시 요청, FS 5-2).
--  total_count는 페이지 자르기 전 전체 수 (count(*) over () 를 자르기 전 단계에서 계산).
-- 연도 값(years)·배당(dividends)은 현재 페이지 행에만 붙인다 (정렬 전 전체 행에 붙이면 낭비).
-- 보안: security invoker (밑 뷰·테이블의 RLS를 따름), search_path 고정,
--       실행 권한은 anon·authenticated·service_role (FS 5장 공통).
-- 인덱스: 새로 만들지 않는다. company_summary_filters_gin(matched_filters GIN) 사용.
create or replace function public.screener_search(
  p_filters smallint[],
  p_sort    text,
  p_dir     text,
  p_page    int,
  p_size    int
)
returns table (
  total_count  bigint,
  srtn_cd      text,
  short_code   text,
  itms_nm      text,
  mrkt_ctg     text,
  acc_mt       text,
  is_financial boolean,
  mrkt_tot_amt bigint,
  bas_dt       date,
  years        jsonb,
  dividends    jsonb
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  -- 입력 검증 (FS 5-2). 잘못된 값은 예외로 막는다 (앱은 400으로 먼저 거른다).
  if p_filters is null or cardinality(p_filters) not between 1 and 3 then
    raise exception 'screener_search: p_filters must have 1 to 3 items' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(p_filters) as f where f is null or f < 1 or f > 20) then
    raise exception 'screener_search: p_filters values must be 1 to 20' using errcode = '22023';
  end if;
  if (select count(distinct f) from unnest(p_filters) as f) <> cardinality(p_filters) then
    raise exception 'screener_search: p_filters must not have duplicates' using errcode = '22023';
  end if;
  if p_sort is null or p_sort not in (
    'name', 'market_cap', 'revenue', 'operating_income', 'net_income',
    'total_assets', 'total_equity', 'capital_stock', 'debt_ratio',
    'operating_margin', 'revenue_growth', 'dps'
  ) then
    raise exception 'screener_search: invalid p_sort' using errcode = '22023';
  end if;
  if p_dir is null or p_dir not in ('asc', 'desc') then
    raise exception 'screener_search: invalid p_dir' using errcode = '22023';
  end if;
  if p_size is null or p_size not in (10, 20, 50) then
    raise exception 'screener_search: invalid p_size' using errcode = '22023';
  end if;
  if p_page is null or p_page < 1 then
    raise exception 'screener_search: p_page must be 1 or more' using errcode = '22023';
  end if;

  return query
  with base as (
    select
      t.corp_code,
      t.srtn_cd,
      t.short_code,
      t.itms_nm,
      t.mrkt_ctg,
      t.acc_mt,
      cs.is_financial,
      v.mrkt_tot_amt,
      v.bas_dt,
      -- 화면 연도 Y1~Y3 (v_company_years.is_display_year와 같은 규칙)
      cs.years[greatest(cardinality(cs.years) - 2, 1):] as disp_years,
      -- 정렬 값 (숫자 키). 3개년 열은 최근 연도 행(is_latest) 값
      case p_sort
        when 'market_cap'       then v.mrkt_tot_amt::numeric
        when 'revenue'          then ly.revenue::numeric
        when 'operating_income' then ly.operating_income::numeric
        when 'net_income'       then ly.net_income::numeric
        when 'total_assets'     then ly.total_assets::numeric
        when 'total_equity'     then ly.total_equity::numeric
        when 'capital_stock'    then ly.capital_stock::numeric
        when 'debt_ratio'       then ly.debt_ratio
        when 'operating_margin' then ly.operating_margin
        when 'revenue_growth'   then ly.revenue_growth
        when 'dps'              then ld.dps::numeric
        else null
      end as sort_num,
      -- 정렬 값 (이름 키)
      case when p_sort = 'name' then t.itms_nm end as sort_text
    from public.v_search_targets t
    join public.company_summary cs on cs.corp_code = t.corp_code
    left join public.v_valuation v on v.srtn_cd = t.srtn_cd
    left join public.v_company_years ly on ly.corp_code = t.corp_code and ly.is_latest
    -- 가장 최근 연도 배당 (dividends 행이 없으면 null)
    left join lateral (
      select d.dps
      from public.dividends d
      where d.corp_code = t.corp_code
      order by d.fiscal_year desc
      limit 1
    ) ld on true
    where not t.is_foreign
      and cs.matched_filters @> p_filters
  ),
  ranked as (
    select
      b.*,
      -- 자르기 전 전체 수 (창 함수는 WHERE 뒤, 페이지 자르기 전 단계에서 계산)
      count(*) over () as total_count,
      -- 방향별로 항목을 나눠 null을 항상 뒤로 보낸다 (asc면 asc 항목만 값을 가진다)
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
    r.is_financial,
    r.mrkt_tot_amt,
    r.bas_dt,
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'fiscal_year',      y.fiscal_year,
                 'revenue',          y.revenue,
                 'operating_income', y.operating_income,
                 'net_income',       y.net_income,
                 'total_assets',     y.total_assets,
                 'total_equity',     y.total_equity,
                 'capital_stock',    y.capital_stock,
                 'debt_ratio',       y.debt_ratio,
                 'operating_margin', y.operating_margin,
                 'revenue_growth',   y.revenue_growth
               )
               order by y.fiscal_year
             )
      from public.v_company_years y
      where y.corp_code = r.corp_code
        and y.is_display_year
    ), '[]'::jsonb) as years,
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'fiscal_year', d.fiscal_year,
                 'dps_status',  d.dps_status,
                 'dps',         d.dps
               )
               order by d.fiscal_year
             )
      from public.dividends d
      where d.corp_code = r.corp_code
        and d.fiscal_year = any (r.disp_years)
    ), '[]'::jsonb) as dividends
  from ranked r
  where r.rn > (p_page - 1)::bigint * p_size
    and r.rn <= p_page::bigint * p_size
  order by r.rn;
end;
$$;

-- 실행 권한: FS 5장대로 공개 데이터만 읽으므로 anon·authenticated·service_role에 준다.
-- PUBLIC(기본) 실행 권한은 먼저 거둔다.
revoke execute on function public.screener_search(smallint[], text, text, int, int) from public;
grant execute on function public.screener_search(smallint[], text, text, int, int) to anon, authenticated, service_role;
