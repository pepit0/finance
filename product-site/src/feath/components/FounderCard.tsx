export interface FounderSlot {
  name: string;
  role: string;
  detail: string;
  img: string;
  /** CSS object-position — use to raise/lower the crop inside the fixed square */
  photoPosition?: string;
  /** Scale factor for the photo inside the fixed square (e.g. 1.1 = 10% zoom) */
  photoScale?: number;
}

export function FounderCard({ founder }: { founder: FounderSlot }) {
  const scale = founder.photoScale ?? 1;
  const position = founder.photoPosition ?? "center top";

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative w-full aspect-square shrink-0 rounded-2xl overflow-hidden border border-border transition-all duration-300 bg-secondary/30"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(61,184,112,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
        }}
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
