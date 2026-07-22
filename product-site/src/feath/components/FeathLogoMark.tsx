import logoDark from "../../assets/logo-mark-dark.svg";
import logoLight from "../../assets/logo-mark-light.svg";
import { useTheme } from "../ThemeContext";

type FeathLogoMarkProps = {
  className?: string;
  glow?: boolean;
};

export function FeathLogoMark({ className = "w-8 h-8", glow = true }: FeathLogoMarkProps) {
  const { dark } = useTheme();

  return (
    <img
      src={dark ? logoDark : logoLight}
      alt=""
      aria-hidden="true"
      className={`${className} transition-all`}
      style={glow ? { filter: dark ? "drop-shadow(0 0 12px rgba(61,184,112,0.4))" : "drop-shadow(0 0 12px rgba(30,124,74,0.35))" } : undefined}
    />
  );
}
