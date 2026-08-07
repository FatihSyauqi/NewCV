-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 07, 2026 at 09:54 AM
-- Server version: 10.4.18-MariaDB
-- PHP Version: 7.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_cv_fatih`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `created_at`) VALUES
(1, 'admin', '$2b$10$0PixwA6.d21UWPbLXJVV7.eX.LVGWKYbKQHwIarnC5iZME/ZLlp3K', '2026-08-04 06:14:23');

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'published',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `slug`, `excerpt`, `content`, `image_url`, `category`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Membangun Arsitektur Microservices dengan Dotnet Web API', 'membangun-arsitektur-microservices-dotnet-web-api', 'Pelajari cara merancang API gateway dan microservices menggunakan C# dan Dotnet Web API yang modular dan scalable.', 'Di dunia rekayasa perangkat lunak modern, arsitektur microservices menjadi pilihan utama untuk sistem skala besar. C# .NET Web API menyediakan tools yang matang untuk membuat service berkinerja tinggi.\n\n### Mengapa memilih .NET untuk Microservices?\n1. **Kinerja Tinggi**: Kestrel server sangat cepat.\n2. **Cross-Platform**: Berjalan mulus di Linux container (Docker).\n3. **Ekosistem Kuat**: Dukungan pustaka dependency injection dan ORM bawaan.\n\nDalam artikel ini, kita akan membahas cara mengimplementasikan API Gateway dengan Ocelot dan service penunjang lainnya...', '/images/blog/dotnet-microservices.svg', 'Backend Development', 'published', '2026-08-04 06:14:24', '2026-08-04 07:48:37'),
(2, 'Tips Integrasi React Native dengan REST API Berbasis JWT', 'tips-integrasi-react-native-rest-api-jwt', 'Panduan praktis mengamankan otentikasi REST API di aplikasi mobile Android & iOS menggunakan React Native.', 'Mengelola state otentikasi di React Native memerlukan perhatian khusus pada keamanan penyimpanan token (Access Token & Refresh Token).\n\n### Gunakan Secure Storage\nHindari menggunakan AsyncStorage biasa untuk menyimpan token JWT. Lebih baik gunakan:\n* `react-native-keychain` untuk Android Keystore & iOS Keychain.\n* Integrasi library yang didukung enkripsi bawaan.\n\nMari kita lihat contoh konfigurasi Axios interceptor untuk menangani request dengan Authorization Header secara dinamis...', '/images/blog/react-native-jwt.svg', 'Mobile Development', 'published', '2026-08-04 06:14:24', '2026-08-04 07:48:32');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `issuer` varchar(150) NOT NULL,
  `credential_id` varchar(100) DEFAULT NULL,
  `issue_date` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `title`, `issuer`, `credential_id`, `issue_date`, `sort_order`) VALUES
(1, 'KEYWORD RESEARCH COURSE WITH GREG GIFFORD', 'Semrush.com', '415701', '2023', 1),
(2, 'CERTIFIED WEB DEVELOPER (CWDEV)', 'Badan Nasional Sertifikasi Profesi (BNSP)', '62019 2513 6 0028243 2024', '2024', 2);

-- --------------------------------------------------------

--
-- Table structure for table `chat_admin_status`
--

CREATE TABLE `chat_admin_status` (
  `id` int(11) NOT NULL,
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `chat_admin_status`
--

INSERT INTO `chat_admin_status` (`id`, `last_seen`) VALUES
(1, '2026-08-07 07:54:16');

-- --------------------------------------------------------

--
-- Table structure for table `chat_blocked_entities`
--

CREATE TABLE `chat_blocked_entities` (
  `id` int(11) NOT NULL,
  `type` enum('ip','email','phone') NOT NULL,
  `value` varchar(150) NOT NULL,
  `reason` varchar(255) DEFAULT 'Spam/Abuse',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `sender_type` enum('user','admin') NOT NULL,
  `sender_name` varchar(100) NOT NULL,
  `message_html` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_size` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL,
  `session_token` varchar(64) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `visitor_device_id` varchar(64) DEFAULT NULL,
  `initial_message` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `closed_by` varchar(20) DEFAULT NULL,
  `unread_user` int(11) DEFAULT 0,
  `unread_admin` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_typing_at` timestamp NULL DEFAULT NULL,
  `admin_typing_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `contact_inquiries`
--

CREATE TABLE `contact_inquiries` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `files` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `contact_inquiries_files`
--

CREATE TABLE `contact_inquiries_files` (
  `id` int(11) NOT NULL,
  `inquiry_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `education`
--

CREATE TABLE `education` (
  `id` int(11) NOT NULL,
  `school` varchar(150) NOT NULL,
  `degree` varchar(100) NOT NULL,
  `major` varchar(100) NOT NULL,
  `gpa` varchar(20) DEFAULT NULL,
  `start_date` varchar(50) NOT NULL,
  `end_date` varchar(50) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `logo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `education`
--

INSERT INTO `education` (`id`, `school`, `degree`, `major`, `gpa`, `start_date`, `end_date`, `sort_order`, `logo_url`) VALUES
(1, 'STIKOM BINANIAGA BOGOR / UNIVERSITY OF BINANIAGA INDONESIA', 'Bachelor\'s Degree', 'Informatics Engineering', '3.53 from 4.00', 'Sept 2015', 'Jan 2020', 1, '/uploads/education/stikom-binaniaga-bogor-university-of-binaniaga-indonesia-7cc5.png');

-- --------------------------------------------------------

--
-- Table structure for table `experiences`
--

CREATE TABLE `experiences` (
  `id` int(11) NOT NULL,
  `company` varchar(150) NOT NULL,
  `role` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `start_date` varchar(50) NOT NULL,
  `end_date` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `logo_url` varchar(255) DEFAULT NULL,
  `skill_ids` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `experiences`
--

INSERT INTO `experiences` (`id`, `company`, `role`, `location`, `start_date`, `end_date`, `description`, `sort_order`, `logo_url`, `skill_ids`) VALUES
(1, 'PT. Berlian Sistem informasi', 'Software Engineer', 'East Jakarta, DKI Jakarta', 'Dec 2025', 'Now', 'Responsible for supporting operations and handling change requests using a technology stack that includes .NET Core, ReactJS, SQL Server, Azure DevOps, PAM 360, Docker Container, and Flutter.', 1, '/uploads/experiences/pt-berlian-sistem-informasi-f124.png', '20,19,18,17,5,1,4'),
(2, 'PT. Sinergi Informatika Semen Indonesia', 'Fullstack Developer', 'South Jakarta, DKI Jakarta', 'Aug 2024', 'Nov 2025', 'Developing and maintaining web applications for corporate clients, including human capital systems (SINTA) and port management operations (SIGMA 2.0). Utilized technologies such as C#, .NET Web API, JavaScript, jQuery Ajax, Java Idempiere, and ReactJS.', 2, '/uploads/experiences/pt-sinergi-informatika-semen-indonesia-6ee8.png', '20,18,19,5,1,4,2,14,17'),
(3, 'PT. Sawerigading Multi Kreasi', 'Software Engineer', 'Bogor, West Java', 'Feb 2019', 'July 2024', 'I work full-time at PT Sawerigading Multi Kreasi (Software House) as a software engineer. My responsibilities include developing website and mobile application projects, designing, as well as serving as a DevOps engineer managing servers using the Linux operating system and utilizing VMware for virtualization and cloud computing control.', 3, '/uploads/experiences/pt-sawerigading-multi-kreasi-ac90.png', '17,20,14,16,19,15,18,1,5,4,2,7'),
(4, 'Ministry of Investment / BKPM', 'Technical Programmer', 'South Jakarta, DKI Jakarta', 'Jan 2023', 'Dec 2023', 'I work part-time at Directorate Development of Regional Potential for developing PIR (Regional Investment Potential) website applications. In developing the website applications, I use a tech stack that includes JavaScript, PHP Laravel, React (GatsbyJS) and C# .NET 5.0.', 4, '/uploads/experiences/ministry-of-investment-bkpm-e397.png', '20,14,18,19,1,2,4,15'),
(5, 'PT. Diantama Sukses Mandiri', 'Fullstack Developer', 'Kebayoran Lama, South Jakarta', 'Jan 2017', 'Dec 2022', 'I work part-time at PT Diantama Sukses Mandiri. I built this app from scratch, created an ERD and created a business process and database. Projects include: Web Application (online learning and shopping using HTML, JavaScript frontend, PHP backend; previews: brazedplate.net, jualkomponen.com, heatexchangerspecialist.com, diantamasukses.com) and Mobile Application (React Native, OneSignal, Midtrans, RajaOngkir, GitHub).', 5, '/uploads/experiences/pt-diantama-sukses-mandiri-df59.png', '20,18,16,2,7');

-- --------------------------------------------------------

--
-- Table structure for table `personal_info`
--

CREATE TABLE `personal_info` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `github` varchar(255) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `about_me` text DEFAULT NULL,
  `portfolio_url` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `personal_info`
--

INSERT INTO `personal_info` (`id`, `name`, `title`, `email`, `linkedin`, `github`, `location`, `about_me`, `portfolio_url`, `avatar_url`, `updated_at`) VALUES
(1, 'Fatih Syauqi', 'Software Engineer', 'fatihsyqi@gmail.com', 'https://www.linkedin.com/in/fatihsyauqi17', 'https://github.com/fatihsyauqi17', 'Bogor, Jawa Barat, ID', 'I am an Indonesian software engineer with 9 years of experience. I specialize in designing and engineering high-performance web applications and mobile apps, with expertise in ASP.NET, PHP Laravel, React Native, and DevOps cloud server administration.', 'https://fatihsyauqi.my.id', '/uploads/profile/avatar-2eb0.png', '2026-08-05 06:47:11');

-- --------------------------------------------------------

--
-- Table structure for table `portfolios`
--

CREATE TABLE `portfolios` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `tech_stack` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `preview_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `portfolios`
--

INSERT INTO `portfolios` (`id`, `title`, `category`, `description`, `tech_stack`, `image_url`, `preview_url`, `created_at`) VALUES
(1, 'SIPINTAS - INFRASTRUKTUR PEMERINTAHAN', 'Mobile Application', 'An application to view Government Infrastructure Data in Border Areas. It helps central and regional governments determine policy formulation in infrastructure provision by presenting quality, accurate, real-time, and relevant data.', 'C#, Dotnet Web API, React Native', '/images/portfolio/sipintas.svg', '#', '2026-08-04 06:14:24'),
(2, 'SURLIS - PT. MASTER KOMPETEN INDONESIA', 'Mobile Application', 'A partner application of the Ministry of ATR/BPN serving requests for surveying, measuring, and mapping. It simplifies making land measurement requests, viewing licensed surveyor service offices (KJSB), and simulating land registration fees.', 'C#, Dotnet Web API, React Native', '/images/portfolio/surlis.svg', 'https://play.google.com/store/apps/details?id=com.maski.survei', '2026-08-04 06:14:24'),
(3, 'ASYSYIRKAH WEB ADMIN', 'Website', 'A web application developed for a Shariah investment finance system, enabling smooth administration of investments, transactions, and user management.', 'C#, Web API Dotnet, ReactJS', '/images/portfolio/asysyirkah.svg', 'https://koperasi.asysyirkah.com', '2026-08-04 06:14:24'),
(4, 'PIR - REGIONAL INVESTMENT POTENTIAL', 'Website', 'A website application designed for promoting regional investment opportunities in government sectors, featuring interactive potential maps and regional analytics.', 'C#, Web API Dotnet, PHP Laravel', '/images/portfolio/pir.svg', 'https://regionalinvestment.bkpm.go.id', '2026-08-04 06:14:24'),
(5, 'S-ONE - SATUKAN DATA', 'Website', 'The main product of PT Sawerigading Multi Kreasi. An information system for government data aggregation, storage, and visualization.', 'C#, Web API Dotnet, ReactJS, React Redux', '/images/portfolio/s-one.svg', 'https://s-one.swg.co.id', '2026-08-04 06:14:24'),
(6, 'SURVEY MUBA APP', 'Mobile Application', 'A mobile-based survey data collection system built for the Musi Banyuasin district community to gather public feedback and demographics.', 'C#, Web API Dotnet, React Native', '/images/portfolio/survey-muba.svg', 'https://s.id/MubaSurveiApp', '2026-08-04 06:14:24'),
(7, 'SINTA - SISTEM INFORMASI TALENTA', 'Website', 'An internal human capital management application developed for employees and talent tracking at PT Semen Indonesia Tbk (SIG).', 'C#, Web API Dotnet, Javascript, Jquery Ajax', '/images/portfolio/sinta.svg', 'https://sinta.sig.id', '2026-08-04 06:14:24'),
(8, 'SIGMA 2.0 - MANAGEMENT PORT', 'Website', 'An integrated port operation management portal developed in accordance with shipping and logistics standards at PT Semen Indonesia Tbk (SIG).', 'Web API Java Idempiere, ReactJS', '/images/portfolio/sigma.svg', 'https://scm.sig.id', '2026-08-04 06:14:24');

-- --------------------------------------------------------

--
-- Table structure for table `seo_settings`
--

CREATE TABLE `seo_settings` (
  `id` int(11) NOT NULL,
  `meta_title` varchar(255) NOT NULL,
  `meta_description` text NOT NULL,
  `meta_keywords` text DEFAULT NULL,
  `og_title` varchar(255) DEFAULT NULL,
  `og_description` text DEFAULT NULL,
  `og_image` varchar(255) DEFAULT NULL,
  `canonical_url` varchar(255) DEFAULT NULL,
  `author_name` varchar(100) DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `target_services` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `seo_settings`
--

INSERT INTO `seo_settings` (`id`, `meta_title`, `meta_description`, `meta_keywords`, `og_title`, `og_description`, `og_image`, `canonical_url`, `author_name`, `job_title`, `target_services`, `updated_at`) VALUES
(1, 'Fatih Syauqi - Senior Software Engineer & Web Mobile App Developer', 'Jasa Pembuatan Website, Aplikasi Mobile (React Native), & API Gateway Enterprise oleh Fatih Syauqi - Senior Software Engineer 9+ tahun pengalaman (.NET C#, PHP Laravel, ReactJS). Siap bekerjasama dengan perusahaan & bisnis.', 'Software Engineer Indonesia, Jasa Pembuatan Aplikasi, Fullstack Developer, React Native Engineer, ASP.NET Developer, Hire Software Engineer, IT Consultant, Web Developer Bogor Jakarta', 'Fatih Syauqi - Senior Software Engineer & Enterprise App Developer', 'Portofolio & CV Fatih Syauqi, Software Engineer berpengalaman dalam membangun aplikasi web & mobile scalable untuk perusahaan dan bisnis.', '/uploads/profile/avatar-2eb0.png', 'https://fatihsyauqi.my.id', 'Fatih Syauqi', 'Senior Software Engineer', 'Software Architecture, Web Application Development, Mobile App Development, Cloud DevOps, System Integration', '2026-08-07 02:13:11'),
(2, 'Fatih Syauqi - Senior Software Engineer & Web Mobile App Developer', 'Jasa Pembuatan Website, Aplikasi Mobile (React Native), & API Gateway Enterprise oleh Fatih Syauqi - Senior Software Engineer 9+ tahun pengalaman (.NET C#, PHP Laravel, ReactJS). Siap bekerjasama dengan perusahaan & bisnis.', 'Software Engineer Indonesia, Jasa Pembuatan Aplikasi, Fullstack Developer, React Native Engineer, ASP.NET Developer, Hire Software Engineer, IT Consultant, Web Developer Bogor Jakarta', 'Fatih Syauqi - Senior Software Engineer & Enterprise App Developer', 'Portofolio & CV Fatih Syauqi, Software Engineer berpengalaman dalam membangun aplikasi web & mobile scalable untuk perusahaan dan bisnis.', '/uploads/profile/avatar-2eb0.png', 'https://fatihsyauqi.my.id', 'Fatih Syauqi', 'Senior Software Engineer', 'Software Architecture, Web Application Development, Mobile App Development, Cloud DevOps, System Integration', '2026-08-07 02:13:11');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_highlight` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `category`, `name`, `logo_url`, `sort_order`, `is_highlight`) VALUES
(1, 'Programming Languages', '.NET C#', '/uploads/skills/net-c-24c2.png', 1, 1),
(2, 'Programming Languages', 'PHP', '/uploads/skills/php-d435.png', 3, 1),
(4, 'Programming Languages', 'ReactJS', '/uploads/skills/reactjs-bac0.png', 2, 1),
(5, 'Programming Languages', 'SQL Server', '/uploads/skills/sql-server-e6b8.png', 4, 1),
(7, 'Design Tools', 'Adobe Photoshop', '/uploads/skills/adobe-photoshop-d010.jpg', 10, 0),
(14, 'Others', 'Jenkins', '/uploads/skills/jenkins-7e1f.png', 5, 1),
(15, 'Programming Languages', 'PostgreSQL', '/uploads/skills/postgresql-7b07.png', 6, 0),
(16, 'Programming Languages', 'MySQL', '/uploads/skills/mysql-1831.png', 7, 0),
(17, 'Programming Tools', 'Docker Container', '/uploads/skills/docker-container-30eb.png', 8, 0),
(18, 'Programming Tools', 'Visual Studio Code', '/uploads/skills/visual-studio-code-0d2d.png', 9, 0),
(19, 'Programming Tools', 'Postman', '/uploads/skills/postman-13aa.png', 11, 0),
(20, 'Programming Tools', 'Git - Version Control', '/uploads/skills/git-version-control-c547.webp', 12, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_admin_status`
--
ALTER TABLE `chat_admin_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_blocked_entities`
--
ALTER TABLE `chat_blocked_entities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `type_value` (`type`,`value`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`);

--
-- Indexes for table `contact_inquiries`
--
ALTER TABLE `contact_inquiries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_inquiries_files`
--
ALTER TABLE `contact_inquiries_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inquiry_id` (`inquiry_id`);

--
-- Indexes for table `education`
--
ALTER TABLE `education`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `experiences`
--
ALTER TABLE `experiences`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personal_info`
--
ALTER TABLE `personal_info`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `portfolios`
--
ALTER TABLE `portfolios`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seo_settings`
--
ALTER TABLE `seo_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `chat_blocked_entities`
--
ALTER TABLE `chat_blocked_entities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_inquiries`
--
ALTER TABLE `contact_inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_inquiries_files`
--
ALTER TABLE `contact_inquiries_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `education`
--
ALTER TABLE `education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `experiences`
--
ALTER TABLE `experiences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `personal_info`
--
ALTER TABLE `personal_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `seo_settings`
--
ALTER TABLE `seo_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `contact_inquiries_files`
--
ALTER TABLE `contact_inquiries_files`
  ADD CONSTRAINT `contact_inquiries_files_ibfk_1` FOREIGN KEY (`inquiry_id`) REFERENCES `contact_inquiries` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
