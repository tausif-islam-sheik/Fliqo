import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const web = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const routes = ["", "/offers", "/blog", "/tours", "/visa", "/faq", "/contact"];
  const urls: MetadataRoute.Sitemap = routes.map((r) => ({ url: `${web}${r}`, changeFrequency: "daily" }));
  try {
    const [tours, posts] = await Promise.all([
      fetch(`${api}/tours`, { next: { revalidate: 3600 } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`${api}/blog`, { next: { revalidate: 3600 } }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
    ]);
    for (const t of tours) urls.push({ url: `${web}/tours/${t.slug}` });
    for (const p of posts) urls.push({ url: `${web}/blog/${p.slug}` });
  } catch {}
  return urls;
}
