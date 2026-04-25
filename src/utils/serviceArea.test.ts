import { describe, expect, it } from "vitest";
import { extractProvinceCodes, parseServiceAreaFromCell, provinceMatchesServiceArea } from "./serviceArea";

describe("parseServiceAreaFromCell", () => {
  it("treats Canada-wide phrases as nationwide", () => {
    expect(parseServiceAreaFromCell("CANADA WIDE").canadaWide).toBe(true);
    expect(parseServiceAreaFromCell("Canada wide").canadaWide).toBe(true);
    expect(parseServiceAreaFromCell("Nationwide").canadaWide).toBe(true);
  });

  it("parses comma-separated provinces as allowlist", () => {
    const r = parseServiceAreaFromCell("ON, BC, AB");
    expect(r.canadaWide).toBe(false);
    expect(r.isDenylist).toBe(false);
    expect(r.provinces).toEqual(["ON", "BC", "AB"]);
  });

  it("parses exclusion wording as denylist", () => {
    const r = parseServiceAreaFromCell("Does not service QC, NL");
    expect(r.canadaWide).toBe(false);
    expect(r.isDenylist).toBe(true);
    expect(r.provinces).toEqual(["QC", "NL"]);
  });

  it("treats Except as denylist", () => {
    const r = parseServiceAreaFromCell("Except QC");
    expect(r.isDenylist).toBe(true);
    expect(r.provinces).toEqual(["QC"]);
  });
});

describe("provinceMatchesServiceArea", () => {
  it("matches allowlist and denylist", () => {
    const allow = parseServiceAreaFromCell("ON, BC");
    expect(provinceMatchesServiceArea(allow, "ON")).toBe(true);
    expect(provinceMatchesServiceArea(allow, "QC")).toBe(false);

    const deny = parseServiceAreaFromCell("Not in QC");
    expect(provinceMatchesServiceArea(deny, "QC")).toBe(false);
    expect(provinceMatchesServiceArea(deny, "ON")).toBe(true);
  });
});

describe("extractProvinceCodes", () => {
  it("deduplicates codes", () => {
    expect(extractProvinceCodes("ON, ON, BC")).toEqual(["ON", "BC"]);
  });
});
