import { describe, expect, it } from "vitest";
import { parseLondonderryInventoryMarkdown } from "./londonderryInventory";

describe("parseLondonderryInventoryMarkdown", () => {
  it("extracts vehicle title, price, mileage, and details URL", () => {
    const markdown = `
## Used 2019 Jeep Cherokee 4WD SPORT

Retail Price 20,999 Discount - 2,000 Price 18,999 Weekly Payment

| Odometer | 113,380 Km |
| --- | --- |
| Trim | 4WD Sport |

[Vehicle Details](https://www.londonderrydodge.com/auto/used-2019-jeep-cherokee-4wd-sport-edmonton-ab/115777718/)
`;
    const rows = parseLondonderryInventoryMarkdown(markdown);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "Used 2019 Jeep Cherokee 4WD SPORT",
      year: 2019,
      priceCad: 18999,
      odometerKm: 113380,
      detailsUrl: "https://www.londonderrydodge.com/auto/used-2019-jeep-cherokee-4wd-sport-edmonton-ab/115777718/",
      imageUrl: "https://www.londonderrydodge.com/images/vehicles/115777718/1.jpg"
    });
  });
});

