import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: ["icons/*.svg", "manifest.webmanifest"],
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
      injectManifest: {
        globPatterns: []
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ]
});
