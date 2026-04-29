import { useEffect, useMemo, useState } from "react";
import {
  fetchLondonderryInventoryPage,
  fetchVehicleHeroImage,
  type InventoryVehicle
} from "../utils/londonderryInventory";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

const integer = new Intl.NumberFormat("en-CA");

interface InventoryMatchesPanelProps {
  approvedMaxPriceCad: number;
}

type PanelState = "idle" | "loading" | "error" | "ready";

function sortByBestFit(maxPrice: number, items: InventoryVehicle[]): InventoryVehicle[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aGap = Math.abs(maxPrice - a.priceCad);
    const bGap = Math.abs(maxPrice - b.priceCad);
    if (aGap !== bGap) {
      return aGap - bGap;
    }
    return b.priceCad - a.priceCad;
  });
  return sorted;
}

function VehicleImage({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const [broken, setBroken] = useState(false);
  if (!imageUrl || broken) {
    return (
      <div className="inventoryMatchThumbPlaceholder" aria-hidden>
        No photo
      </div>
    );
  }
  return <img className="inventoryMatchThumb" src={imageUrl} alt={title} loading="lazy" onError={() => setBroken(true)} />;
}

export function InventoryMatchesPanel({ approvedMaxPriceCad }: InventoryMatchesPanelProps) {
  const [state, setState] = useState<PanelState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<InventoryVehicle[]>([]);
  const [photoByUrl, setPhotoByUrl] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setErrorMessage(null);
    setVehicles([]);

    const run = async () => {
      try {
        const rows = await fetchLondonderryInventoryPage();
        if (cancelled) {
          return;
        }
        setVehicles(rows);
        setState("ready");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setState("error");
        setErrorMessage(err instanceof Error ? err.message : "Unable to load website inventory.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const ceiling = approvedMaxPriceCad * 0.92;
    const eligible = vehicles.filter((v) => v.priceCad <= ceiling);
    return sortByBestFit(ceiling, eligible).slice(0, 8);
  }, [approvedMaxPriceCad, vehicles]);

  useEffect(() => {
    const queue = matches.filter((v) => !(v.detailsUrl in photoByUrl)).slice(0, 4);
    if (queue.length === 0) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      for (const item of queue) {
        const image = await fetchVehicleHeroImage(item.detailsUrl);
        if (cancelled) {
          return;
        }
        setPhotoByUrl((prev) => ({ ...prev, [item.detailsUrl]: image }));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [matches, photoByUrl]);

  return (
    <section className="inventoryMatchesSection">
      <div className="inventoryMatchesHeaderRow">
        <h3 className="calculatorSubheading">Website inventory matches</h3>
        <p className="inventoryMatchesBudget">
          Budget target: <strong>{money.format(approvedMaxPriceCad * 0.92)}</strong> (after 8% buffer)
        </p>
      </div>

      {state === "loading" ? <p className="calculatorHint">Checking Londonderry Dodge inventory…</p> : null}
      {state === "error" ? (
        <p className="calculatorError">
          Could not load inventory right now. {errorMessage ? `(${errorMessage})` : ""}
        </p>
      ) : null}
      {state === "ready" && matches.length === 0 ? (
        <p className="calculatorHint">No current listings found under the buffered approval amount.</p>
      ) : null}

      {matches.length > 0 ? (
        <div className="inventoryMatchGrid">
          {matches.map((item) => (
            <a
              key={item.detailsUrl}
              className="inventoryMatchCard"
              href={item.detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <VehicleImage imageUrl={photoByUrl[item.detailsUrl] ?? item.imageUrl} title={item.title} />
              <div className="inventoryMatchBody">
                <h4>{item.title}</h4>
                <p className="inventoryMatchPrice">{money.format(item.priceCad)}</p>
                <p className="inventoryMatchMeta">
                  {item.odometerKm !== null ? `${integer.format(item.odometerKm)} km` : "Mileage n/a"}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

