import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/env";

// Only the public landing pages are meant for search engines. Assessment,
// results, report and feedback pages are per-session and hold enterprise
// data; admin and dashboard are researcher tools.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo"],
      disallow: [
        "/assessment/",
        "/results/",
        "/reports/",
        "/feedback/",
        "/dashboard",
        "/admin",
        "/api/",
        "/django-admin/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
