import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { SITE_URL } from "@/config/env";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Agribusiness Bankability Index (ABI) -- Demo v0.1",
  description:
    "Research prototype financing-readiness self-assessment for agribusiness enterprises.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e3b2e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
