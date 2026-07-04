import type { MetadataRoute } from "next";
const base = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/contact", "/track", "/login", "/signup"],
      disallow: ["/dashboard", "/admin", "/checkout", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
