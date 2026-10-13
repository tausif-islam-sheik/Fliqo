import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const web = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/payment", "/flights/search", "/flights/booking", "/verify-email", "/2fa", "/mock-gateway"] }],
    sitemap: `${web}/sitemap.xml`
  };
}
