import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();
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
