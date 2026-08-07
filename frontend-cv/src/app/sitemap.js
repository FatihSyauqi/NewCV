import { query } from "@/lib/db";
import { getSeoSettings } from "@/lib/seo";

export default async function sitemap() {
  const seo = await getSeoSettings();
  const baseUrl = (seo?.canonical_url || "https://fatihsyauqi.my.id").replace(/\/$/, "");

  let blogs = [];
  try {
    blogs = await query("SELECT slug, updated_at, created_at FROM blogs WHERE status = 'published'");
  } catch (error) {
    console.error("Error fetching blogs for sitemap:", error);
  }

  const blogUrls = blogs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at || post.created_at || new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...blogUrls,
  ];
}
