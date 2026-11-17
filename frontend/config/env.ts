export const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN ?? "agribusinessbankability.com";

// Public origin used for canonical URLs, robots.txt and sitemap.xml, so
// search engines index the site under its own domain and not under any
// other hostname that happens to point at the server.
export const SITE_URL = `https://${APP_DOMAIN}`;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

export const IS_PRODUCTION = APP_ENV === "production";
