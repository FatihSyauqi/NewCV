import { query } from './db';

export async function getSeoSettings() {
  try {
    // Ensure table exists
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
      return rows[0];
    }

    // Seed default if empty
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

    return defaultSeo;
  } catch (error) {
    console.error("Error loading SEO settings from DB:", error);
    return {
      meta_title: 'Fatih Syauqi - Senior Software Engineer & Web Mobile App Developer',
      meta_description: 'CV & Portfolio Fatih Syauqi, Senior Software Engineer berpengalaman dalam membangun sistem Web & Mobile Application scalable.',
      meta_keywords: 'Software Engineer, Fullstack Developer, React Native, C# .NET, Web Developer',
      og_title: 'Fatih Syauqi - Senior Software Engineer',
      og_description: 'Portofolio & CV Fatih Syauqi, Senior Software Engineer.',
      og_image: '/uploads/profile/avatar-2eb0.png',
      canonical_url: 'https://fatihsyauqi.my.id',
      author_name: 'Fatih Syauqi',
      job_title: 'Senior Software Engineer',
      target_services: 'Web Development, Mobile App Development, Enterprise Solutions'
    };
  }
}
