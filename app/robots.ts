import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/contact", "/track", "/login", "/signup", "/privacy", "/terms"],
      disallow: ["/dashboard", "/admin", "/checkout", "/onboarding", "/reset-password"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
