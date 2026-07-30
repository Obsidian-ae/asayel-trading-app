import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import appConfig from "./src/app-config.json" with { type: "json" };

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: appConfig.client.business_name,
        short_name: appConfig.client.business_name.slice(0, 12),
        description: "Business control center for " + appConfig.client.business_name,
        theme_color: appConfig.branding.color_bg_dark,
        background_color: appConfig.branding.color_bg_dark,
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
