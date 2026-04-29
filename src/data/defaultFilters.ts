import type { FilterState } from "../types/lender";

export const defaultFilters: FilterState = {
  openBK: false,
  repo: false,
  selfEmployed: false,
  nineSinNewToCanada: false,
  secondUnit: false,
  nativeStatus: false,
  dateOfBirth: "",
  province: "",
  creditScore: null,
  ltv: null,
  jobTenureYears: null,
  jobTenureMonths: null,
  incomeAmountCad: null,
  incomeProgram: ""
};