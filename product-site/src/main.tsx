import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./feath/App";
import "./styles/index.css";

function initTheme() {
  try {
    const theme = localStorage.getItem("feath-site-theme");
    document.documentElement.classList.toggle("dark", theme !== "light");
  } catch {
    document.documentElement.classList.add("dark");
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

initTheme();

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}
