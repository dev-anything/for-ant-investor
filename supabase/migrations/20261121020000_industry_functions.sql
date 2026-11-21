-- 웹앱 DB 함수 5-3~5-5 (FS 5장): F-15 업종 둘러보기 · F-08 지표 비교 목록
-- 적용은 사용자 확인 뒤에만 한다 (FS 5장). 이 파일은 작성만 한 상태다.
-- 공통: security invoker, search_path 고정, anon·authenticated·service_role 실행 (5-2와 같은 방식).
-- 대상 회사: v_search_targets 중 외국회사 제외, division_name이 있는 회사 (분류표에 없는 업종 제외, 금융회사 포함).
-- 대분류 이름은 포털 표기 그대로 반환한다 (공백 정리는 화면에서만, 라이선스 규칙).

-- =====================================================================
-- 5-3. industry_tree() — F-15 업종 목록 (대분류 > 중분류 + 회사 수)
-- =====================================================================
create or replace function public.industry_tree()
returns table (
  section_code   text,
  section_name   text,
  section_order  smallint,
  division_code  text,
  division_name  text,
  division_order smallint,
  company_count  bigint
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  return query
  select
    t.section_code,
    sec.name        as section_name,
    sec.sort_order  as section_order,
    t.division_code,
    t.division_name,
    d.sort_order    as division_order,
    count(*)        as company_count
  from public.v_search_targets t
  join public.ksic_classes d
    on d.code = t.division_code and d.level = 'division'
  join public.ksic_classes sec
    on sec.code = t.section_code and sec.level = 'section'
  where not t.is_foreign
    and t.division_name is not null
  group by
    t.section_code, sec.name, sec.sort_order,
    t.division_code, t.division_name, d.sort_order
  order by sec.sort_order, d.sort_order, t.division_code;
end;
$$;

revoke execute on function public.industry_tree() from public;
grant execute on function public.industry_tree() to anon, authenticated, service_role;

-- =====================================================================
-- 5-4. industry_companies(p_division, p_sort, p_dir, p_page, p_size) — F-15 회사 목록
-- =====================================================================
-- 정렬 키: name → itms_nm, market_cap → mrkt_tot_amt (v_valuation, 없으면 null)
-- null은 방향과 상관없이 맨 뒤, 같은 값은 itms_nm asc → srtn_cd asc 로 순서 고정.
create or replace function public.industry_companies(
  p_division text,
  p_sort     text,
  p_dir      text,
  p_page     int,
  p_size     int
)
returns table (
  total_count  bigint,
  srtn_cd      text,
  short_code   text,
  itms_nm      text,
  mrkt_ctg     text,
  acc_mt       text,
  mrkt_tot_amt bigint,
  bas_dt       date
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  -- 입력 검증 (FS 5-4). 잘못된 값은 예외로 막는다.
  if p_division is null or p_division !~ '^[0-9]{2}$' then
    raise exception 'industry_companies: p_division must be 2 digits' using errcode = '22023';
  end if;
  if p_sort is null or p_sort not in ('name', 'market_cap') then
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
      case when p_sort = 'market_cap' then v.mrkt_tot_amt::numeric end as sort_num,
      case when p_sort = 'name'       then t.itms_nm end             as sort_text
    from public.v_search_targets t
    left join public.v_valuation v on v.srtn_cd = t.srtn_cd
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
    r.bas_dt
  from ranked r
  where r.rn > (p_page - 1)::bigint * p_size
    and r.rn <= p_page::bigint * p_size
  order by r.rn;
end;
$$;

revoke execute on function public.industry_companies(text, text, text, int, int) from public;
grant execute on function public.industry_companies(text, text, text, int, int) to anon, authenticated, service_role;

-- =====================================================================
-- 5-5. industry_metrics(p_division, p_sort, p_dir, p_page, p_size) — F-08 지표 비교 목록
-- =====================================================================
-- 재무 없는 회사도 포함 (지표 null). 제목의 회사 수 N은 industry_companies total_count와 같아야 한다.
-- 정렬 키: name → itms_nm, debt_ratio / operating_margin / revenue_growth → v_company_years 최근 연도(is_latest) 값.
-- null은 맨 뒤, 같은 값은 itms_nm asc → srtn_cd asc.
create or replace function public.industry_metrics(
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
  is_financial     boolean,
  fiscal_year      smallint,
  debt_ratio       numeric,
  operating_margin numeric,
  revenue_growth   numeric
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  -- 입력 검증 (FS 5-5)
  if p_division is null or p_division !~ '^[0-9]{2}$' then
    raise exception 'industry_metrics: p_division must be 2 digits' using errcode = '22023';
  end if;
  if p_sort is null or p_sort not in ('name', 'debt_ratio', 'operating_margin', 'revenue_growth') then
    raise exception 'industry_metrics: invalid p_sort' using errcode = '22023';
  end if;
  if p_dir is null or p_dir not in ('asc', 'desc') then
    raise exception 'industry_metrics: invalid p_dir' using errcode = '22023';
  end if;
  if p_size is null or p_size not in (10, 20, 50) then
    raise exception 'industry_metrics: invalid p_size' using errcode = '22023';
  end if;
  if p_page is null or p_page < 1 then
    raise exception 'industry_metrics: p_page must be 1 or more' using errcode = '22023';
  end if;

  return query
  with base as (
    select
      t.srtn_cd,
      t.short_code,
      t.itms_nm,
      t.mrkt_ctg,
      t.acc_mt,
      cs.is_financial,
      ly.fiscal_year,
      ly.debt_ratio,
      ly.operating_margin,
      ly.revenue_growth,
      case when p_sort = 'debt_ratio'       then ly.debt_ratio
           when p_sort = 'operating_margin' then ly.operating_margin
           when p_sort = 'revenue_growth'   then ly.revenue_growth
      end as sort_num,
      case when p_sort = 'name' then t.itms_nm end as sort_text
    from public.v_search_targets t
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
    r.is_financial,
    r.fiscal_year,
    r.debt_ratio,
    r.operating_margin,
    r.revenue_growth
  from ranked r
  where r.rn > (p_page - 1)::bigint * p_size
    and r.rn <= p_page::bigint * p_size
  order by r.rn;
end;
$$;

revoke execute on function public.industry_metrics(text, text, text, int, int) from public;
grant execute on function public.industry_metrics(text, text, text, int, int) to anon, authenticated, service_role;
