import { describe, expect, it } from "vitest";
import { formatMonthlyBudgetCadDisplay } from "./monthlyBudgetCad";

describe("formatMonthlyBudgetCadDisplay", () => {
  it("maps website budget codes to readable labels", () => {
    expect(formatMonthlyBudgetCadDisplay("199")).toBe("Less than $200/month");
    expect(formatMonthlyBudgetCadDisplay("1001")).toBe("$1000+/month");
  });

  it("formats plain dollar amounts", () => {
    expect(formatMonthlyBudgetCadDisplay("500")).toBe("$500/month");
    expect(formatMonthlyBudgetCadDisplay("Less than $200/month")).toBe("Less than $200/month");
  });
});
