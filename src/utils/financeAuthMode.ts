import { isFinanceProduct } from "./productMode";

/** Local/demo finance deploy with no Supabase login. Never enable in production. */
export function isFinanceSkipAuth(): boolean {
  return isFinanceProduct() && import.meta.env.VITE_FINANCE_SKIP_AUTH === "true";
}
