import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        // The framework definition (dimensions/questions/gates/bands) is
        // cached so the wizard can render offline after the first online
        // load, per docs/07_FRONTEND_ARCHITECTURE.md § Offline / PWA.
        urlPattern: /\/api\/v1\/frameworks\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "abi-framework-cache",
          expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
