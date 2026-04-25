import type { FilterState } from "../types/lender";

export const defaultFilters: FilterState = {
  openBK: false,
  repo: false,
  selfEmployed: false,
  newToCanada: false,
  hasNineSin: false,
  dateOfBirth: "",
  province: "",
  creditScore: null,
  ltv: null
};