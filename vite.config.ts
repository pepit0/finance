import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** Overwrite workbox-generated sw.js with our push-only worker (no precache install step). */
function crmPushServiceWorkerPlugin() {
  return {
    name: "crm-push-service-worker",
    enforce: "post" as const,
    closeBundle() {
      const src = path.resolve("public/sw.js");
      const dest = path.resolve("dist/sw.js");
      fs.copyFileSync(src, dest);
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "Temptation CRM",
        short_name: "Tempt CRM",
        description: "CRM for inbound texts and calls",
        start_url: "/crm",
        scope: "/",
        display: "standalone",
        theme_color: "#f05d22",
        background_color: "#0c0d10",
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/icons/icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        runtimeCaching: []
      },
      devOptions: {
        enabled: false
      }
    }),
    crmPushServiceWorkerPlugin()
  ]
});
