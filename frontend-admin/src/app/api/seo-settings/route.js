import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Auto-create table if not exists
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

    const rows = await query("SELECT * FROM seo_settings LIMIT 1");
    
    if (rows && rows.length > 0) {
      return NextResponse.json(rows[0]);
    }

    // Default if empty
    const defaultSeo = {
      meta_title: 'Fatih Syauqi - Senior Software Engineer & Web Mobile App Developer',
      meta_description: 'Jasa Pembuatan Website, Aplikasi Mobile (React Native), & API Gateway Enterprise oleh Fatih Syauqi - Senior Software Engineer 9+ tahun pengalaman (.NET C#, PHP Laravel, ReactJS). Siap bekerjasama dengan perusahaan & bisnis.',
      meta_keywords: 'Software Engineer Indonesia, Jasa Pembuatan Aplikasi, Fullstack Developer, React Native Engineer, ASP.NET Developer, Hire Software Engineer, IT Consultant, Web Developer Bogor Jakarta',
      og_title: 'Fatih Syauqi - Senior Software Engineer & Enterprise App Developer',
      og_description: 'Portofolio & CV Fatih Syauqi, Software Engineer berpengalaman dalam membangun aplikasi web & mobile scalable untuk perusahaan dan bisnis.',
      og_image: '/uploads/profile/avatar-2eb0.png',
      canonical_url: 'https://fatihsyauqi.my.id',
      author_name: 'Fatih Syauqi',
      job_title: 'Senior Software Engineer',
      target_services: 'Software Architecture, Web Application Development, Mobile App Development, Cloud DevOps, System Integration'
    };

    await query(`
      INSERT INTO seo_settings (meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url, author_name, job_title, target_services)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      defaultSeo.meta_title,
      defaultSeo.meta_description,
      defaultSeo.meta_keywords,
      defaultSeo.og_title,
      defaultSeo.og_description,
      defaultSeo.og_image,
      defaultSeo.canonical_url,
      defaultSeo.author_name,
      defaultSeo.job_title,
      defaultSeo.target_services
    ]);

    const seeded = await query("SELECT * FROM seo_settings LIMIT 1");
    return NextResponse.json(seeded[0] || defaultSeo);
  } catch (error) {
    console.error("GET seo-settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      meta_title,
      meta_description,
      meta_keywords,
      og_title,
      og_description,
      og_image,
      canonical_url,
      author_name,
      job_title,
      target_services
    } = await request.json();

    const existing = await query("SELECT id FROM seo_settings LIMIT 1");

    if (existing && existing.length > 0) {
      await query(
        `UPDATE seo_settings 
         SET meta_title = ?, meta_description = ?, meta_keywords = ?, og_title = ?, og_description = ?, og_image = ?, canonical_url = ?, author_name = ?, job_title = ?, target_services = ?
         WHERE id = ?`,
        [
          meta_title,
          meta_description,
          meta_keywords,
          og_title,
          og_description,
          og_image,
          canonical_url,
          author_name,
          job_title,
          target_services,
          existing[0].id
        ]
      );
    } else {
      await query(
        `INSERT INTO seo_settings (meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url, author_name, job_title, target_services)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          meta_title,
          meta_description,
          meta_keywords,
          og_title,
          og_description,
          og_image,
          canonical_url,
          author_name,
          job_title,
          target_services
        ]
      );
    }

    return NextResponse.json({ success: true, message: "SEO settings updated successfully!" });
  } catch (error) {
    console.error("POST seo-settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
