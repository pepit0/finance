import { useEffect, useState } from "react";
import type { EvaluatedLender } from "../types/lender";
import { getBookingGuideUrl } from "../data/lenderBookingGuides";
import { isEmbeddableWithoutPdfContentType, normalizeBookingGuideEmbedUrl } from "../utils/bookingGuideUrl";
import { LenderLogo } from "./LenderLogo";
import type { VehicleBookGuideCaption } from "./VehicleBookPanel";

function VehicleBookGuideVinBanner({
  caption,
  attached
}: {
  caption: VehicleBookGuideCaption;
  attached: boolean;
}) {
  const cls = attached ? "bookingGuideVinBanner bookingGuideVinBannerAttached" : "bookingGuideVinBanner";
  return (
    <div className={cls} role="status">
      <span className="bookingGuideVinBannerLabel">Decoded vehicle</span>
      <div className="bookingGuideVinBannerRow">
        <div className="bookingGuideVinBannerValues">
          <span className="bookingGuideVinYear">{caption.modelYear}</span>
          <span className="bookingGuideVinSep" aria-hidden>
            ·
          </span>
          <span className="bookingGuideVinKm">{caption.odometerLabel}</span>
        </div>
        <div className="bookingGuideVinNameCol">
          <span className="bookingGuideVinVehicleName">{caption.vehicleName}</span>
          <span className="bookingGuideVinTrim">{caption.trimLabel}</span>
        </div>
      </div>
      <p className="bookingGuideVinSub">Use the guide tables for this vehicle.</p>
    </div>
  );
}

export interface LenderBookingGuidePanelProps {
  selectedLenders: EvaluatedLender[];
  activeGuideLenderName: string | null;
  onActiveGuideLenderChange: (lenderName: string) => void;
  vehicleGuideCaption: VehicleBookGuideCaption | null;
}

export function LenderBookingGuidePanel({
  selectedLenders,
  activeGuideLenderName,
  onActiveGuideLenderChange,
  vehicleGuideCaption
}: LenderBookingGuidePanelProps) {
  const [resolvedGuideUrl, setResolvedGuideUrl] = useState<string | null>(null);
  const active =
    selectedLenders.find((e) => e.lender.lenderName === activeGuideLenderName) ?? selectedLenders[0] ?? null;
  const activeName = active?.lender.lenderName ?? "";
  const sheetUrl = (active?.lender.bookingGuideUrl ?? "").trim();
  const localUrl = activeName ? getBookingGuideUrl(activeName) : null;
  const candidateRaw = sheetUrl || localUrl || "";
  const candidate = candidateRaw ? normalizeBookingGuideEmbedUrl(candidateRaw) : "";

  useEffect(() => {
    let cancelled = false;
    setResolvedGuideUrl(null);
    if (!candidate) {
      return () => {
        cancelled = true;
      };
    }

    if (isEmbeddableWithoutPdfContentType(candidate)) {
      setResolvedGuideUrl(candidate);
      return () => {
        cancelled = true;
      };
    }

    const verifyPdf = async () => {
      try {
        const response = await fetch(candidate, { method: "GET", headers: { Range: "bytes=0-1023" } });
        if (!response.ok) {
          return;
        }
        const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
        if (contentType.includes("application/pdf") && !cancelled) {
          setResolvedGuideUrl(candidate);
        }
      } catch {
        // Keep empty-state message when file is missing or unreadable.
      }
    };

    void verifyPdf();
    return () => {
      cancelled = true;
    };
  }, [candidate]);

  if (selectedLenders.length === 0) {
    return (
      <section className="calculatorPanel lenderBookingGuidePanel" aria-labelledby="bookingGuideHeading">
        <header className="calculatorHeader">
          <div className="calculatorPanelHeaderRow">
            <h2 id="bookingGuideHeading">Booking guide</h2>
          </div>
          <p className="calculatorIntro">Select a lender on the Lenders tab to open their vehicle booking guide here.</p>
        </header>
        <p className="bookingGuideEmpty">No lender selected.</p>
      </section>
    );
  }

  return (
    <section className="calculatorPanel lenderBookingGuidePanel" aria-labelledby="bookingGuideHeading">
      <header className="calculatorHeader">
        <div className="calculatorPanelHeaderRow">
          <h2 id="bookingGuideHeading">Booking guide</h2>
        </div>
        <p className="calculatorIntro">{activeName}</p>
      </header>

      {selectedLenders.length > 1 ? (
        <div className="bookingGuideSwitcher" role="tablist" aria-label="Lender booking guides">
          {selectedLenders.map((item) => {
            const name = item.lender.lenderName;
            const isActive = name === activeName;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`bookingGuideSwitcherBtn${isActive ? " bookingGuideSwitcherBtnActive" : ""}`}
                onClick={() => onActiveGuideLenderChange(name)}
                title={name}
                aria-label={`Show booking guide for ${name}`}
              >
                <LenderLogo
                  lenderName={item.lender.lenderName}
                  websiteUrl={item.lender.websiteUrl}
                  className="bookingGuideSwitcherLogo"
                  loading="eager"
                  alt=""
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {resolvedGuideUrl ? (
        vehicleGuideCaption ? (
          <div className="bookingGuideViewerStack">
            <VehicleBookGuideVinBanner caption={vehicleGuideCaption} attached />
            <div className="bookingGuideFrameWrap bookingGuideFrameWrapAttached">
              <iframe
                className="bookingGuideFrame"
                title={`${activeName} booking guide`}
                src={resolvedGuideUrl}
              />
            </div>
          </div>
        ) : (
          <div className="bookingGuideFrameWrap">
            <iframe
              className="bookingGuideFrame"
              title={`${activeName} booking guide`}
              src={resolvedGuideUrl}
            />
          </div>
        )
      ) : (
        <>
          {vehicleGuideCaption ? <VehicleBookGuideVinBanner caption={vehicleGuideCaption} attached={false} /> : null}
          <div className="bookingGuideMissing">
            <p>No booking guide PDF on file for this lender.</p>
            <p className="bookingGuideMissingHint">
              The published CSV must include the real link: paste the https://… URL in the cell, or use a formula like{" "}
              <code className="bookingGuideCode">{"=HYPERLINK(\"https://…\",\"BOOKING GUIDE\")"}</code> or{" "}
              <code className="bookingGuideCode">{"=HYPERLINK(\"BOOKING GUIDE\",\"https://…\")"}</code> — display text
              alone usually has no URL in the CSV. Keep it on the row above the website
              for that lender (same column,
              or a few columns to the left on that row). Or add a file under{" "}
              <code className="bookingGuideCode">public/lender-guides/</code>{" "}
              and map <code className="bookingGuideCode">{activeName}</code> in{" "}
              <code className="bookingGuideCode">src/data/lenderBookingGuides.ts</code>.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
