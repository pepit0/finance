import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";
import "./styles/temptation-theme.css";
import "./styles/crm-light-theme.css";
import "./styles/crm-control-style.css";

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error("[PWA] Service worker registration failed:", error);
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
