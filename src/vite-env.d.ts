/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PRODUCT?: "full" | "finance" | "crm";
  readonly VITE_CRM_APP_URL?: string;
  readonly VITE_FINANCE_APP_URL?: string;
  readonly VITE_MARKETING_SITE_URL?: string;
  readonly VITE_LENDERS_CSV_URL?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_CRM_DIRECTORY_MASTER_EMAIL?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
