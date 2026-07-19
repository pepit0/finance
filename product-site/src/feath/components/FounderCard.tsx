import { useState } from "react";

export interface FounderSlot {
  name: string;
  role: string;
  detail: string;
  img: string;
  /** Shown on the back of the photo when clicked */
  bio: string;
  /** CSS object-position — use to raise/lower the crop inside the fixed square */
  photoPosition?: string;
  /** Scale factor for the photo inside the fixed square (e.g. 1.1 = 10% zoom) */
  photoScale?: number;
}

export function FounderCard({ founder }: { founder: FounderSlot }) {
  const [flipped, setFlipped] = useState(false);
  const scale = founder.photoScale ?? 1;
  const position = founder.photoPosition ?? "center top";

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? `Hide bio for ${founder.name}` : `Show bio for ${founder.name}`}
        onClick={() => setFlipped((v) => !v)}
        className="relative w-full aspect-square shrink-0 rounded-2xl border border-border bg-secondary/30 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ perspective: "1000px" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(61,184,112,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front — photo */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <img
              src={founder.img}
              alt={founder.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: position,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: position,
              }}
            />
          </div>

          {/* Back — bio */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border border-border bg-card flex items-center justify-center p-6"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p
              className="text-center text-sm md:text-base text-foreground leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {founder.bio}
            </p>
          </div>
        </div>
      </button>
      <div className="text-center">
        <div className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {founder.name}
        </div>
        <div className="text-sm text-muted-foreground">{founder.role}</div>
        <div className="text-sm text-muted-foreground italic">{founder.detail}</div>
      </div>
    </div>
  );
}
