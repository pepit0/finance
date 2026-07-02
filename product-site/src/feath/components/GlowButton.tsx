import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlowButtonProps = {
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "md" | "lg";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function GlowButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: GlowButtonProps) {
  const pad = size === "lg" ? "px-8 py-4" : "px-6 py-3";

  if (variant === "primary") {
    return (
      <button
        {...props}
        className={`${pad} relative inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg font-semibold transition-all duration-300 hover:brightness-110 ${className}`}
        style={{ boxShadow: "0 0 0 0 rgba(61,184,112,0)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 28px rgba(61,184,112,0.45), 0 4px 16px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 0 rgba(61,184,112,0)";
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={`${pad} inline-flex items-center gap-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary hover:border-primary/30 transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );
}
