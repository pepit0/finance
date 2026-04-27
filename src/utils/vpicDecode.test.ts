import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { decodeVinExtended, parseVinDecodeResponse, validateVinFormat } from "./vpicDecode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../test/fixtures/vpic-sample.json");

describe("validateVinFormat", () => {
  it("accepts a valid 17-char VIN pattern", () => {
    expect(validateVinFormat("5UXWX7C5XBA000000")).toBeNull();
  });

  it("rejects wrong length", () => {
    expect(validateVinFormat("SHORT")).not.toBeNull();
  });

  it("rejects I O Q", () => {
    expect(validateVinFormat("5UXIX7C5XBA000000")).not.toBeNull();
  });
});

describe("parseVinDecodeResponse", () => {
  it("maps fixture to DecodedVehicle", () => {
    const payload = JSON.parse(readFileSync(fixturePath, "utf8"));
    const r = parseVinDecodeResponse(payload);
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.make).toBe("BMW");
      expect(r.model).toBe("X3");
      expect(r.modelYear).toBe("2011");
      expect(r.trim).toBe("xDrive28i");
    }
  });
});

describe("decodeVinExtended", () => {
  it("returns validation error without fetching for bad VIN", async () => {
    const r = await decodeVinExtended("BAD");
    expect("error" in r).toBe(true);
    if ("error" in r) {
      expect(r.error).toMatch(/17/);
    }
  });
});
