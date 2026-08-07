import { getSeoSettings } from "@/lib/seo";

export default async function robots() {
  const seo = await getSeoSettings();
  const baseUrl = (seo?.canonical_url || "https://fatihsyauqi.my.id").replace(/\/$/, "");

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
