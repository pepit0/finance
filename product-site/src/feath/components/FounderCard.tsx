export interface FounderSlot {
  name: string;
  role: string;
  img: string;
}

export function FounderCard({ founder }: { founder: FounderSlot }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border transition-all duration-300 bg-secondary/30"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(61,184,112,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <img src={founder.img} alt={founder.name} className="w-full h-full object-cover" />
      </div>
      <div className="text-center">
        <div className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {founder.name}
        </div>
        <div className="text-sm text-muted-foreground">{founder.role}</div>
      </div>
    </div>
  );
}
