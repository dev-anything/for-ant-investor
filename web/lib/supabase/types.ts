// 생성 파일: Supabase 타입 생성(generate_typescript_types)으로 만든다. 직접 고치지 않는다. (FS 3-2)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_opinions: {
        Row: {
          adt_opinion: string | null
          adt_reprt_spcmnt_matter: string | null
          adtor: string | null
          core_adt_matter: string | null
          corp_code: string
          emphs_matter: string | null
          fetched_at: string
          fiscal_year: number
          period_label: string | null
          row_no: number
          source_bsns_year: number
          source_rcept_no: string | null
        }
        Insert: {
          adt_opinion?: string | null
          adt_reprt_spcmnt_matter?: string | null
          adtor?: string | null
          core_adt_matter?: string | null
          corp_code: string
          emphs_matter?: string | null
          fetched_at?: string
          fiscal_year: number
          period_label?: string | null
          row_no: number
          source_bsns_year: number
          source_rcept_no?: string | null
        }
        Update: {
          adt_opinion?: string | null
          adt_reprt_spcmnt_matter?: string | null
          adtor?: string | null
          core_adt_matter?: string | null
          corp_code?: string
          emphs_matter?: string | null
          fetched_at?: string
          fiscal_year?: number
          period_label?: string | null
          row_no?: number
          source_bsns_year?: number
          source_rcept_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_opinions_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      batch_runs: {
        Row: {
          bas_dt: string | null
          finished_at: string | null
          id: number
          job: string
          note: string | null
          started_at: string
          stats: Json
          status: string | null
        }
        Insert: {
          bas_dt?: string | null
          finished_at?: string | null
          id?: never
          job: string
          note?: string | null
          started_at?: string
          stats?: Json
          status?: string | null
        }
        Update: {
          bas_dt?: string | null
          finished_at?: string | null
          id?: never
          job?: string
          note?: string | null
          started_at?: string
          stats?: Json
          status?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          acc_mt: string | null
          corp_cls: string | null
          corp_code: string
          corp_name: string
          division_code: string | null
          fetched_at: string
          induty_code: string | null
          jurir_no: string | null
          raw: Json | null
          stock_code: string | null
        }
        Insert: {
          acc_mt?: string | null
          corp_cls?: string | null
          corp_code: string
          corp_name: string
          division_code?: string | null
          fetched_at?: string
          induty_code?: string | null
          jurir_no?: string | null
          raw?: Json | null
          stock_code?: string | null
        }
        Update: {
          acc_mt?: string | null
          corp_cls?: string | null
          corp_code?: string
          corp_name?: string
          division_code?: string | null
          fetched_at?: string
          induty_code?: string | null
          jurir_no?: string | null
          raw?: Json | null
          stock_code?: string | null
        }
        Relationships: []
      }
      company_summary: {
        Row: {
          capital_impairment: string
          computed_at: string
          corp_code: string
          financial_reason: string | null
          fs_div: string
          insights: Json
          is_financial: boolean
          latest_year: number
          matched_filters: number[]
          rule_version: string
          years: number[]
        }
        Insert: {
          capital_impairment: string
          computed_at?: string
          corp_code: string
          financial_reason?: string | null
          fs_div: string
          insights?: Json
          is_financial: boolean
          latest_year: number
          matched_filters?: number[]
          rule_version: string
          years: number[]
        }
        Update: {
          capital_impairment?: string
          computed_at?: string
          corp_code?: string
          financial_reason?: string | null
          fs_div?: string
          insights?: Json
          is_financial?: boolean
          latest_year?: number
          matched_filters?: number[]
          rule_version?: string
          years?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "company_summary_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      dart_fetch_status: {
        Row: {
          api: string
          checked_at: string
          corp_code: string
          last_bsns_year: number | null
          last_rcept_no: string | null
          message: string | null
          retry_count: number
          status: string
        }
        Insert: {
          api: string
          checked_at?: string
          corp_code: string
          last_bsns_year?: number | null
          last_rcept_no?: string | null
          message?: string | null
          retry_count?: number
          status: string
        }
        Update: {
          api?: string
          checked_at?: string
          corp_code?: string
          last_bsns_year?: number | null
          last_rcept_no?: string | null
          message?: string | null
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
      data_issues: {
        Row: {
          batch_run_id: number | null
          corp_code: string | null
          created_at: string
          detail: Json
          fiscal_year: number | null
          id: number
          kind: string
        }
        Insert: {
          batch_run_id?: number | null
          corp_code?: string | null
          created_at?: string
          detail?: Json
          fiscal_year?: number | null
          id?: never
          kind: string
        }
        Update: {
          batch_run_id?: number | null
          corp_code?: string | null
          created_at?: string
          detail?: Json
          fiscal_year?: number | null
          id?: never
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_issues_batch_run_id_fkey"
            columns: ["batch_run_id"]
            isOneToOne: false
            referencedRelation: "batch_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      dividend_rows: {
        Row: {
          bsns_year: number
          corp_code: string
          fetched_at: string
          frmtrm: string | null
          lwfr: string | null
          rcept_no: string
          row_no: number
          se: string | null
          stlm_dt: string | null
          stock_knd: string | null
          thstrm: string | null
        }
        Insert: {
          bsns_year: number
          corp_code: string
          fetched_at?: string
          frmtrm?: string | null
          lwfr?: string | null
          rcept_no: string
          row_no: number
          se?: string | null
          stlm_dt?: string | null
          stock_knd?: string | null
          thstrm?: string | null
        }
        Update: {
          bsns_year?: number
          corp_code?: string
          fetched_at?: string
          frmtrm?: string | null
          lwfr?: string | null
          rcept_no?: string
          row_no?: number
          se?: string | null
          stlm_dt?: string | null
          stock_knd?: string | null
          thstrm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dividend_rows_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      dividends: {
        Row: {
          corp_code: string
          dividend_yield: number | null
          dps: number | null
          dps_status: string
          fiscal_year: number
          source_bsns_year: number
          source_rcept_no: string
          yield_status: string
        }
        Insert: {
          corp_code: string
          dividend_yield?: number | null
          dps?: number | null
          dps_status: string
          fiscal_year: number
          source_bsns_year: number
          source_rcept_no: string
          yield_status: string
        }
        Update: {
          corp_code?: string
          dividend_yield?: number | null
          dps?: number | null
          dps_status?: string
          fiscal_year?: number
          source_bsns_year?: number
          source_rcept_no?: string
          yield_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividends_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      financials: {
        Row: {
          capital_stock: number | null
          corp_code: string
          fetched_at: string
          fiscal_year: number
          fs_div: string
          has_revenue_account: boolean
          net_income: number | null
          operating_income: number | null
          other_accounts: Json
          revenue: number | null
          source_bsns_year: number
          source_rcept_no: string
          total_assets: number | null
          total_equity: number | null
          total_liabilities: number | null
        }
        Insert: {
          capital_stock?: number | null
          corp_code: string
          fetched_at?: string
          fiscal_year: number
          fs_div: string
          has_revenue_account: boolean
          net_income?: number | null
          operating_income?: number | null
          other_accounts?: Json
          revenue?: number | null
          source_bsns_year: number
          source_rcept_no: string
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Update: {
          capital_stock?: number | null
          corp_code?: string
          fetched_at?: string
          fiscal_year?: number
          fs_div?: string
          has_revenue_account?: boolean
          net_income?: number | null
          operating_income?: number | null
          other_accounts?: Json
          revenue?: number | null
          source_bsns_year?: number
          source_rcept_no?: string
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financials_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      ksic_classes: {
        Row: {
          code: string
          level: string
          name: string
          section_code: string | null
          sort_order: number
        }
        Insert: {
          code: string
          level: string
          name: string
          section_code?: string | null
          sort_order: number
        }
        Update: {
          code?: string
          level?: string
          name?: string
          section_code?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ksic_classes_section_code_fkey"
            columns: ["section_code"]
            isOneToOne: false
            referencedRelation: "ksic_classes"
            referencedColumns: ["code"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          emailed_at: string | null
          fiscal_year: number | null
          id: number
          kind: string
          read_at: string | null
          srtn_cd: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key: string
          emailed_at?: string | null
          fiscal_year?: number | null
          id?: never
          kind: string
          read_at?: string | null
          srtn_cd: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          emailed_at?: string | null
          fiscal_year?: number | null
          id?: never
          kind?: string
          read_at?: string | null
          srtn_cd?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["srtn_cd"]
          },
          {
            foreignKeyName: "notifications_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "v_search_targets"
            referencedColumns: ["srtn_cd"]
          },
          {
            foreignKeyName: "notifications_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "v_valuation"
            referencedColumns: ["srtn_cd"]
          },
        ]
      }
      stock_prices: {
        Row: {
          bas_dt: string
          clpr: number | null
          isin_cd: string | null
          itms_nm: string | null
          lstg_st_cnt: number | null
          mrkt_ctg: string | null
          mrkt_tot_amt: number | null
          raw: Json | null
          srtn_cd: string
        }
        Insert: {
          bas_dt: string
          clpr?: number | null
          isin_cd?: string | null
          itms_nm?: string | null
          lstg_st_cnt?: number | null
          mrkt_ctg?: string | null
          mrkt_tot_amt?: number | null
          raw?: Json | null
          srtn_cd: string
        }
        Update: {
          bas_dt?: string
          clpr?: number | null
          isin_cd?: string | null
          itms_nm?: string | null
          lstg_st_cnt?: number | null
          mrkt_ctg?: string | null
          mrkt_tot_amt?: number | null
          raw?: Json | null
          srtn_cd?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          corp_code: string | null
          corp_nm: string | null
          crno: string | null
          delisted_bas_dt: string | null
          first_bas_dt: string
          is_foreign: boolean | null
          is_listed: boolean
          is_spac: boolean | null
          isin_cd: string | null
          itms_nm: string
          last_bas_dt: string
          mrkt_ctg: string
          search_name: string | null
          short_code: string
          srtn_cd: string
          updated_at: string
        }
        Insert: {
          corp_code?: string | null
          corp_nm?: string | null
          crno?: string | null
          delisted_bas_dt?: string | null
          first_bas_dt?: string
          is_foreign?: boolean | null
          is_listed?: boolean
          is_spac?: boolean | null
          isin_cd?: string | null
          itms_nm: string
          last_bas_dt?: string
          mrkt_ctg: string
          search_name?: string | null
          short_code?: string
          srtn_cd: string
          updated_at?: string
        }
        Update: {
          corp_code?: string | null
          corp_nm?: string | null
          crno?: string | null
          delisted_bas_dt?: string | null
          first_bas_dt?: string
          is_foreign?: boolean | null
          is_listed?: boolean
          is_spac?: boolean | null
          isin_cd?: string | null
          itms_nm?: string
          last_bas_dt?: string
          mrkt_ctg?: string
          search_name?: string | null
          short_code?: string
          srtn_cd?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_opt_in: boolean
          unsubscribe_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_opt_in?: boolean
          unsubscribe_token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_opt_in?: boolean
          unsubscribe_token?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          crno: string | null
          srtn_cd: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crno?: string | null
          srtn_cd: string
          user_id: string
        }
        Update: {
          created_at?: string
          crno?: string | null
          srtn_cd?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["srtn_cd"]
          },
          {
            foreignKeyName: "watchlist_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "v_search_targets"
            referencedColumns: ["srtn_cd"]
          },
          {
            foreignKeyName: "watchlist_srtn_cd_fkey"
            columns: ["srtn_cd"]
            isOneToOne: false
            referencedRelation: "v_valuation"
            referencedColumns: ["srtn_cd"]
          },
        ]
      }
    }
    Views: {
      v_company_years: {
        Row: {
          capital_impairment: string | null
          capital_stock: number | null
          corp_code: string | null
          debt_ratio: number | null
          fiscal_year: number | null
          fs_div: string | null
          is_display_year: boolean | null
          is_financial: boolean | null
          is_latest: boolean | null
          net_income: number | null
          operating_income: number | null
          operating_margin: number | null
          revenue: number | null
          revenue_growth: number | null
          total_assets: number | null
          total_equity: number | null
          total_liabilities: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financials_corp_code_fkey"
            columns: ["corp_code"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["corp_code"]
          },
        ]
      }
      v_industry_medians: {
        Row: {
          debt_ratio_median: number | null
          debt_ratio_n: number | null
          division_code: string | null
          operating_margin_median: number | null
          operating_margin_n: number | null
          pbr_median: number | null
          pbr_n: number | null
          per_median: number | null
          per_n: number | null
          revenue_growth_median: number | null
          revenue_growth_n: number | null
        }
        Relationships: []
      }
      v_search_targets: {
        Row: {
          acc_mt: string | null
          corp_code: string | null
          division_code: string | null
          division_name: string | null
          induty_code: string | null
          is_foreign: boolean | null
          itms_nm: string | null
          mrkt_ctg: string | null
          search_name: string | null
          section_code: string | null
          section_name: string | null
          short_code: string | null
          srtn_cd: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ksic_classes_section_code_fkey"
            columns: ["section_code"]
            isOneToOne: false
            referencedRelation: "ksic_classes"
            referencedColumns: ["code"]
          },
        ]
      }
      v_valuation: {
        Row: {
          bas_dt: string | null
          clpr: number | null
          corp_code: string | null
          is_financial: boolean | null
          latest_year: number | null
          mrkt_tot_amt: number | null
          net_income: number | null
          pbr: number | null
          per: number | null
          short_code: string | null
          srtn_cd: string | null
          total_equity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
