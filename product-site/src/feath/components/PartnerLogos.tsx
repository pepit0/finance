// Placeholder "trusted by" company logos — distinctive monochrome brand marks
// that inherit `currentColor`.
type LogoProps = { className?: string };

export function ApertureLogo({ className }: LogoProps) {
  const blades = [0, 60, 120, 180, 240, 300];
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {blades.map((deg, i) => (
        <path
          key={deg}
          d="M12 12L12 2.4A9.6 9.6 0 0 1 20.31 7.2Z"
          transform={`rotate(${deg} 12 12)`}
          opacity={i % 2 === 0 ? 1 : 0.45}
        />
      ))}
      <circle cx="12" cy="12" r="2.3" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function PrismLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M12 3.4L21 19.6H3L12 3.4z" strokeWidth="1.9" strokeLinejoin="round" />
      <g strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M2.2 13.2h6.3" />
        <path d="M8.5 13.2l6.4-4" />
        <path d="M8.5 13.2l7.2.4" />
        <path d="M8.5 13.2l6.4 4.8" />
      </g>
    </svg>
  );
}

export function FacetLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 4h11l3.5 5L12 20 3 9l3.5-5z" />
      <path d="M3 9h18" opacity="0.7" />
      <path d="M6.5 4L9 9l3 11M17.5 4L15 9l-3 11M12 4v5M9 9h6" opacity="0.5" />
    </svg>
  );
}

export function HelixLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M7 3.4C17 6.4 17 9.4 7 12.4S-3 18.4 7 21.4" opacity="0.9" />
      <path d="M17 3.4C7 6.4 7 9.4 17 12.4s10 6 0 9" opacity="0.5" />
    </svg>
  );
}
