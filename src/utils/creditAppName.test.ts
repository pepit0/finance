import { describe, expect, it } from "vitest";
import {
  formatCreditAppLegalName,
  splitPersonName,
  validateCustomerNameParts
} from "./creditAppName";

describe("validateCustomerNameParts", () => {
  it("requires first and last name", () => {
    expect(validateCustomerNameParts({ first_name: "", middle_name: "", last_name: "Lee" })).toBe(
      "First name is required."
    );
    expect(validateCustomerNameParts({ first_name: "Kim", middle_name: "", last_name: "" })).toBe(
      "Last name is required."
    );
    expect(validateCustomerNameParts({ first_name: "Kim", middle_name: "Q", last_name: "Lee" })).toBeNull();
  });
});

describe("formatCreditAppLegalName", () => {
  it("includes optional middle name in display name", () => {
    expect(
      formatCreditAppLegalName({ first_name: "Jane", middle_name: "Marie", last_name: "Doe" })
    ).toBe("Jane Marie Doe");
  });

  it("splits legacy display names consistently", () => {
    expect(splitPersonName("Jane Marie Doe")).toEqual({
      first_name: "Jane",
      middle_name: "Marie",
      last_name: "Doe"
    });
  });
});
