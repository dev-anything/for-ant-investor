-- 재무 레이더 첫 스키마 (docs/history/DATABASE.md 2026-11-16 초안 + 8장 결정 반영)
-- 테이블 15개 + 뷰 4개 + RLS. 데이터 넣기(ksic_classes 등)는 별도 작업.

create extension if not exists pg_trgm with schema extensions;

-- =====================================================================
-- 2. 공개 데이터 (배치가 씀, 누구나 읽기)
-- =====================================================================

-- 2-1. 업종 이름표 (한국표준산업분류 제11차). 이름은 포털 표기 그대로.
create table public.ksic_classes (
  code          text primary key,
  level         text not null check (level in ('section', 'division')),
  name          text not null,
  section_code  text references public.ksic_classes (code),
  sort_order    smallint not null
);

-- 2-2. KRX 상장종목 (원본 그대로)
create table public.stocks (
  srtn_cd          text primary key,                                   -- 원본 'A005930'
  short_code       text generated always as (substr(srtn_cd, 2)) stored not null,
  isin_cd          text,
  itms_nm          text not null,
  search_name      text generated always as (lower(regexp_replace(itms_nm, '\s', '', 'g'))) stored,
  mrkt_ctg         text not null,
  crno             text,
  corp_nm          text,
  corp_code        text,                                               -- companies 행이 없을 수도 있어 FK 없음
  is_foreign       boolean generated always as (crno = '0000000000000') stored,
  is_spac          boolean generated always as (itms_nm like '%스팩%') stored,
  first_bas_dt     date not null,
  last_bas_dt      date not null,
  is_listed        boolean not null default true,
  delisted_bas_dt  date,
  updated_at       timestamptz not null default now(),
  constraint stocks_short_code_key unique (short_code)
);
create index stocks_search_name_trgm on public.stocks using gin (search_name extensions.gin_trgm_ops);
create index stocks_corp_code_idx on public.stocks (corp_code);

-- 2-3. DART 기업개황
create table public.companies (
  corp_code      text primary key,
  corp_name      text not null,
  stock_code     text,
  jurir_no       text,
  induty_code    text,
  division_code  text generated always as (left(induty_code, 2)) stored,  -- FK 없음 (11차에 없는 코드는 수집 뒤 검증)
  acc_mt         text,
  corp_cls       text,
  raw            jsonb,
  fetched_at     timestamptz not null default now()
);
create index companies_division_code_idx on public.companies (division_code);

-- 2-4. 연도별 주요계정 (회사 × 사업연도 × 연결/별도)
create table public.financials (
  corp_code            text not null references public.companies (corp_code) on delete cascade,
  fiscal_year          smallint not null,
  fs_div               text not null check (fs_div in ('CFS', 'OFS')),
  revenue              bigint,
  operating_income     bigint,
  net_income           bigint,
  total_assets         bigint,
  total_liabilities    bigint,
  total_equity         bigint,
  capital_stock        bigint,
  has_revenue_account  boolean not null,
  other_accounts       jsonb not null default '{}'::jsonb,
  source_bsns_year     smallint not null,
  source_rcept_no      text not null,
  fetched_at           timestamptz not null default now(),
  primary key (corp_code, fiscal_year, fs_div)
);

-- 2-5. 회사별 계산 결과 (배치가 계산)
create table public.company_summary (
  corp_code           text primary key references public.companies (corp_code) on delete cascade,
  fs_div              text not null check (fs_div in ('CFS', 'OFS')),
  years               smallint[] not null,
  latest_year         smallint not null,
  is_financial        boolean not null,
  financial_reason    text check (financial_reason in ('no_revenue', 'industry', 'both')),
  capital_impairment  text not null check (capital_impairment in ('none', 'partial', 'full', 'unknown')),
  matched_filters     smallint[] not null default '{}',
  insights            jsonb not null default '[]'::jsonb,
  rule_version        text not null,
  computed_at         timestamptz not null default now()
);
create index company_summary_filters_gin on public.company_summary using gin (matched_filters);

-- 2-6. 배당 응답 원본 (회사마다 최신 사업보고서 1건)
create table public.dividend_rows (
  corp_code   text not null references public.companies (corp_code) on delete cascade,
  rcept_no    text not null,
  row_no      smallint not null,
  bsns_year   smallint not null,
  se          text,
  stock_knd   text,
  thstrm      text,
  frmtrm      text,
  lwfr        text,
  stlm_dt     text,
  fetched_at  timestamptz not null default now(),
  primary key (corp_code, rcept_no, row_no)
);

-- 2-7. 연도별 보통주 현금배당 (화면·필터용)
create table public.dividends (
  corp_code         text not null references public.companies (corp_code) on delete cascade,
  fiscal_year       smallint not null,
  dps_status        text not null check (dps_status in ('paid', 'none', 'check')),
  dps               bigint,
  yield_status      text not null check (yield_status in ('value', 'not_disclosed', 'none')),
  dividend_yield    numeric(6, 2),
  source_bsns_year  smallint not null,
  source_rcept_no   text not null,
  primary key (corp_code, fiscal_year)
);

-- 2-8. 감사의견 (회사마다 최신 사업보고서 1건의 3개년, 연도마다 2행)
create table public.audit_opinions (
  corp_code                text not null references public.companies (corp_code) on delete cascade,
  fiscal_year              smallint not null,
  row_no                   smallint not null,
  period_label             text,
  adtor                    text,
  adt_opinion              text,
  emphs_matter             text,
  core_adt_matter          text,
  adt_reprt_spcmnt_matter  text,
  source_bsns_year         smallint not null,
  source_rcept_no          text,
  fetched_at               timestamptz not null default now(),
  primary key (corp_code, fiscal_year, row_no)
);

-- 2-9. 최신 시세 (A 없는 코드, 우선주 포함)
create table public.stock_prices (
  srtn_cd       text primary key,
  bas_dt        date not null,
  isin_cd       text,
  itms_nm       text,
  mrkt_ctg      text,
  clpr          bigint,
  lstg_st_cnt   bigint,
  mrkt_tot_amt  bigint,
  raw           jsonb
);

-- =====================================================================
-- 3. 배치 운영 (서버용 키만)
-- =====================================================================

create table public.batch_runs (
  id           bigint generated always as identity primary key,
  job          text not null check (job in ('krx_list', 'stock_price', 'dart_monthly', 'dart_initial', 'recompute')),
  bas_dt       date,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text check (status in ('ok', 'skipped', 'failed')),
  stats        jsonb not null default '{}'::jsonb,
  note         text
);

create table public.dart_fetch_status (
  corp_code       text not null,                 -- 기업개황 013이면 companies 행이 없어 FK 없음
  api             text not null check (api in ('company', 'fs', 'dividend', 'audit')),
  last_bsns_year  smallint,
  last_rcept_no   text,
  status          text not null check (status in ('000', '013', 'error')),
  retry_count     smallint not null default 0,
  checked_at      timestamptz not null default now(),
  message         text,
  primary key (corp_code, api)
);

create table public.data_issues (
  id            bigint generated always as identity primary key,
  batch_run_id  bigint references public.batch_runs (id) on delete set null,
  kind          text not null,
  corp_code     text,
  fiscal_year   smallint,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index data_issues_batch_run_id_idx on public.data_issues (batch_run_id);
create index data_issues_kind_idx on public.data_issues (kind);

-- =====================================================================
-- 4. 사용자 (탈퇴하면 함께 지워짐)
-- =====================================================================

create table public.user_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  email_opt_in       boolean not null default false,
  unsubscribe_token  uuid not null default gen_random_uuid() unique,
  created_at         timestamptz not null default now()
);

create table public.watchlist (
  user_id     uuid not null references auth.users (id) on delete cascade,
  srtn_cd     text not null references public.stocks (srtn_cd),
  crno        text,
  created_at  timestamptz not null default now(),
  primary key (user_id, srtn_cd)
);
create index watchlist_srtn_cd_idx on public.watchlist (srtn_cd);

-- 1인 20개 상한
create function public.watchlist_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.watchlist w where w.user_id = new.user_id) >= 20 then
    raise exception '추적 종목은 20개까지 등록할 수 있어.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger watchlist_limit_before_insert
  before insert on public.watchlist
  for each row execute function public.watchlist_limit();

create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  srtn_cd     text not null references public.stocks (srtn_cd),
  kind        text not null check (kind in ('new_results', 'delisted', 'audit_change')),
  fiscal_year smallint,
  body        text not null,
  dedupe_key  text not null,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  emailed_at  timestamptz,
  constraint notifications_user_dedupe_key unique (user_id, dedupe_key)
);
create index notifications_srtn_cd_idx on public.notifications (srtn_cd);
create index notifications_unsent_idx on public.notifications (user_id) where emailed_at is null;

-- =====================================================================
-- 6. RLS
-- =====================================================================

-- 공개 데이터: 읽기만
alter table public.ksic_classes    enable row level security;
alter table public.stocks          enable row level security;
alter table public.companies       enable row level security;
alter table public.financials      enable row level security;
alter table public.company_summary enable row level security;
alter table public.dividend_rows   enable row level security;
alter table public.dividends       enable row level security;
alter table public.audit_opinions  enable row level security;
alter table public.stock_prices    enable row level security;

create policy "public read" on public.ksic_classes    for select to anon, authenticated using (true);
create policy "public read" on public.stocks          for select to anon, authenticated using (true);
create policy "public read" on public.companies       for select to anon, authenticated using (true);
create policy "public read" on public.financials      for select to anon, authenticated using (true);
create policy "public read" on public.company_summary for select to anon, authenticated using (true);
create policy "public read" on public.dividend_rows   for select to anon, authenticated using (true);
create policy "public read" on public.dividends       for select to anon, authenticated using (true);
create policy "public read" on public.audit_opinions  for select to anon, authenticated using (true);
create policy "public read" on public.stock_prices    for select to anon, authenticated using (true);

-- 배치 운영: 정책 없음 → 서버용 키만
alter table public.batch_runs        enable row level security;
alter table public.dart_fetch_status enable row level security;
alter table public.data_issues       enable row level security;
revoke all on public.batch_runs, public.dart_fetch_status, public.data_issues from anon, authenticated;

-- 사용자: 본인 행만
alter table public.user_settings enable row level security;
alter table public.watchlist     enable row level security;
alter table public.notifications enable row level security;

create policy "own select" on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "own insert" on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own update" on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- 수신 거부 토큰은 사용자가 바꾸지 못하게: 수정은 email_opt_in만
revoke update on public.user_settings from anon, authenticated;
grant update (email_opt_in) on public.user_settings to authenticated;

create policy "own select" on public.watchlist for select to authenticated using ((select auth.uid()) = user_id);
create policy "own insert" on public.watchlist for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own delete" on public.watchlist for delete to authenticated using ((select auth.uid()) = user_id);

-- 알림: 삽입은 배치만, 사용자는 읽기 + read_at 갱신만
create policy "own select" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "own update" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- =====================================================================
-- 5. 뷰 (security_invoker → 밑 테이블 RLS를 따름)
-- =====================================================================

-- 검색 대상: 목록에 있음 + 코스피·코스닥 + 스팩 제외 (외국회사는 포함, 화면에서 "지원하지 않음")
create view public.v_search_targets with (security_invoker = true) as
select
  s.srtn_cd,
  s.short_code,
  s.itms_nm,
  s.search_name,
  s.mrkt_ctg,
  s.is_foreign,
  s.corp_code,
  c.induty_code,
  c.division_code,
  d.name   as division_name,
  d.section_code,
  sec.name as section_name,
  c.acc_mt
from public.stocks s
left join public.companies c     on c.corp_code = s.corp_code
left join public.ksic_classes d  on d.code = c.division_code and d.level = 'division'
left join public.ksic_classes sec on sec.code = d.section_code
where s.is_listed
  and s.mrkt_ctg in ('KOSPI', 'KOSDAQ')
  and not s.is_spac;

-- 연도별 값 + 계산 지표 (company_summary가 고른 기준·연도만). 금융회사는 리포트카드 지표 null.
create view public.v_company_years with (security_invoker = true) as
select
  f.corp_code,
  f.fiscal_year,
  f.fs_div,
  cs.is_financial,
  cs.capital_impairment,
  f.fiscal_year = any (cs.years[greatest(cardinality(cs.years) - 2, 1):]) as is_display_year,  -- Y1~Y3
  f.fiscal_year = cs.latest_year as is_latest,
  f.revenue,
  f.operating_income,
  f.net_income,
  f.total_assets,
  f.total_liabilities,
  f.total_equity,
  f.capital_stock,
  case when not cs.is_financial and f.total_equity > 0
       then f.total_liabilities::numeric * 100 / f.total_equity end as debt_ratio,
  case when not cs.is_financial and f.revenue > 0
       then f.operating_income::numeric * 100 / f.revenue end as operating_margin,
  case when not cs.is_financial and p.revenue > 0
       then (f.revenue - p.revenue)::numeric * 100 / p.revenue end as revenue_growth
from public.company_summary cs
join public.financials f
  on f.corp_code = cs.corp_code and f.fs_div = cs.fs_div and f.fiscal_year = any (cs.years)
left join public.financials p
  on p.corp_code = f.corp_code and p.fs_div = f.fs_div and p.fiscal_year = f.fiscal_year - 1;

-- PER·PBR: 최신 시세 × 최신 연도 순이익·자본 (보통주 시가총액). 금융회사도 같은 방식.
create view public.v_valuation with (security_invoker = true) as
select
  s.srtn_cd,
  s.short_code,
  s.corp_code,
  p.bas_dt,
  p.clpr,
  p.mrkt_tot_amt,
  cs.is_financial,
  cs.latest_year,
  f.net_income,
  f.total_equity,
  case when f.net_income > 0   then p.mrkt_tot_amt::numeric / f.net_income end   as per,
  case when f.total_equity > 0 then p.mrkt_tot_amt::numeric / f.total_equity end as pbr
from public.stocks s
join public.stock_prices p         on p.srtn_cd = s.short_code
left join public.company_summary cs on cs.corp_code = s.corp_code
left join public.financials f
  on f.corp_code = cs.corp_code and f.fiscal_year = cs.latest_year and f.fs_div = cs.fs_div
where s.is_listed;

-- 중분류별 가운데 값과 값이 있는 회사 수 (최소 회사 수 판단은 API에서)
create view public.v_industry_medians with (security_invoker = true) as
select
  t.division_code,
  percentile_cont(0.5) within group (order by y.debt_ratio::float8)       as debt_ratio_median,
  count(y.debt_ratio)                                                       as debt_ratio_n,
  percentile_cont(0.5) within group (order by y.operating_margin::float8) as operating_margin_median,
  count(y.operating_margin)                                                 as operating_margin_n,
  percentile_cont(0.5) within group (order by y.revenue_growth::float8)   as revenue_growth_median,
  count(y.revenue_growth)                                                   as revenue_growth_n,
  percentile_cont(0.5) within group (order by v.per::float8)              as per_median,
  count(v.per)                                                              as per_n,
  percentile_cont(0.5) within group (order by v.pbr::float8)              as pbr_median,
  count(v.pbr)                                                              as pbr_n
from public.v_search_targets t
left join public.v_company_years y on y.corp_code = t.corp_code and y.is_latest
left join public.v_valuation v     on v.srtn_cd = t.srtn_cd
where t.division_code is not null
group by t.division_code;
