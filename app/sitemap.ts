import type { MetadataRoute } from "next";
const base = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/contact", "/track", "/login", "/signup"].map((path, index) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.6,
  }));
}
