import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/contact", "/track", "/login", "/signup"].map((path, index) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.6,
  }));
}
