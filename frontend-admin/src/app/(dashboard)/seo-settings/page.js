import { query } from "@/lib/db";
import SeoSettingsClient from "./SeoSettingsClient";

export const revalidate = 0;

async function getSeoData() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS \`seo_settings\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`meta_title\` varchar(255) NOT NULL,
        \`meta_description\` text NOT NULL,
        \`meta_keywords\` text DEFAULT NULL,
        \`og_title\` varchar(255) DEFAULT NULL,
        \`og_description\` text DEFAULT NULL,
        \`og_image\` varchar(255) DEFAULT NULL,
        \`canonical_url\` varchar(255) DEFAULT NULL,
        \`author_name\` varchar(100) DEFAULT NULL,
        \`job_title\` varchar(100) DEFAULT NULL,
        \`target_services\` text DEFAULT NULL,
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const res = await query("SELECT * FROM seo_settings LIMIT 1");
    return res[0] || null;
  } catch (error) {
    console.error("Error loading SEO settings:", error);
    return null;
  }
}

export default async function SeoSettingsPage() {
  const seoData = await getSeoData();

  return (
    <div>
      <SeoSettingsClient initialSeo={seoData} />
    </div>
  );
}
