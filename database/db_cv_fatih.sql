-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 05 Agu 2026 pada 02.52
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

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
-- Struktur dari tabel `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `created_at`) VALUES
(1, 'admin', '$2b$10$0PixwA6.d21UWPbLXJVV7.eX.LVGWKYbKQHwIarnC5iZME/ZLlp3K', '2026-08-04 06:14:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `blogs`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `slug`, `excerpt`, `content`, `image_url`, `category`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Membangun Arsitektur Microservices dengan Dotnet Web API', 'membangun-arsitektur-microservices-dotnet-web-api', 'Pelajari cara merancang API gateway dan microservices menggunakan C# dan Dotnet Web API yang modular dan scalable.', 'Di dunia rekayasa perangkat lunak modern, arsitektur microservices menjadi pilihan utama untuk sistem skala besar. C# .NET Web API menyediakan tools yang matang untuk membuat service berkinerja tinggi.\n\n### Mengapa memilih .NET untuk Microservices?\n1. **Kinerja Tinggi**: Kestrel server sangat cepat.\n2. **Cross-Platform**: Berjalan mulus di Linux container (Docker).\n3. **Ekosistem Kuat**: Dukungan pustaka dependency injection dan ORM bawaan.\n\nDalam artikel ini, kita akan membahas cara mengimplementasikan API Gateway dengan Ocelot dan service penunjang lainnya...', '/images/blog/dotnet-microservices.svg', 'Backend Development', 'published', '2026-08-04 06:14:24', '2026-08-04 07:48:37'),
(2, 'Tips Integrasi React Native dengan REST API Berbasis JWT', 'tips-integrasi-react-native-rest-api-jwt', 'Panduan praktis mengamankan otentikasi REST API di aplikasi mobile Android & iOS menggunakan React Native.', 'Mengelola state otentikasi di React Native memerlukan perhatian khusus pada keamanan penyimpanan token (Access Token & Refresh Token).\n\n### Gunakan Secure Storage\nHindari menggunakan AsyncStorage biasa untuk menyimpan token JWT. Lebih baik gunakan:\n* `react-native-keychain` untuk Android Keystore & iOS Keychain.\n* Integrasi library yang didukung enkripsi bawaan.\n\nMari kita lihat contoh konfigurasi Axios interceptor untuk menangani request dengan Authorization Header secara dinamis...', '/images/blog/react-native-jwt.svg', 'Mobile Development', 'published', '2026-08-04 06:14:24', '2026-08-04 07:48:32');

-- --------------------------------------------------------

--
-- Struktur dari tabel `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `issuer` varchar(150) NOT NULL,
  `credential_id` varchar(100) DEFAULT NULL,
  `issue_date` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `certificates`
--

INSERT INTO `certificates` (`id`, `title`, `issuer`, `credential_id`, `issue_date`, `sort_order`) VALUES
(1, 'KEYWORD RESEARCH COURSE WITH GREG GIFFORD', 'Semrush.com', '415701', '2023', 1),
(2, 'CERTIFIED WEB DEVELOPER (CWDEV)', 'Badan Nasional Sertifikasi Profesi (BNSP)', '62019 2513 6 0028243 2024', '2024', 2);

-- --------------------------------------------------------

--
-- Struktur dari tabel `education`
--

CREATE TABLE `education` (
  `id` int(11) NOT NULL,
  `school` varchar(150) NOT NULL,
  `degree` varchar(100) NOT NULL,
  `major` varchar(100) NOT NULL,
  `gpa` varchar(20) DEFAULT NULL,
  `start_date` varchar(50) NOT NULL,
  `end_date` varchar(50) NOT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `education`
--

INSERT INTO `education` (`id`, `school`, `degree`, `major`, `gpa`, `start_date`, `end_date`, `sort_order`) VALUES
(1, 'STIKOM BINANIAGA BOGOR / UNIVERSITY OF BINANIAGA INDONESIA', 'Bachelor\'s Degree', 'Informatics Engineering', '3.53 from 4.00', 'Sept 2015', 'Jan 2020', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `experiences`
--

CREATE TABLE `experiences` (
  `id` int(11) NOT NULL,
  `company` varchar(150) NOT NULL,
  `role` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `start_date` varchar(50) NOT NULL,
  `end_date` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `experiences`
--

INSERT INTO `experiences` (`id`, `company`, `role`, `location`, `start_date`, `end_date`, `description`, `sort_order`) VALUES
(1, 'PT. Berlian Sistem informasi', 'Software Engineer', 'Jakarta, DKI Jakarta', 'Dec 2025', 'Now', 'Responsible for supporting operations and handling change requests using a technology stack that includes .NET Core, ReactJS, SQL Server, Azure DevOps, PAM 360, Docker Container, and Flutter.', 1),
(2, 'PT. Sinergi Informatika Semen Indonesia', 'Fullstack Developer', 'Jakarta, DKI Jakarta', 'Aug 2024', 'Nov 2025', 'Developing and maintaining web applications for corporate clients, including human capital systems (SINTA) and port management operations (SIGMA 2.0). Utilized technologies such as C#, .NET Web API, JavaScript, jQuery Ajax, Java Idempiere, and ReactJS.', 2),
(3, 'PT. Sawerigading Multi Kreasi', 'Software Engineer', 'Bogor, Jawa Barat', 'Feb 2019', 'July 2024', 'I work full-time at PT Sawerigading Multi Kreasi (Software House) as a software engineer. My responsibilities include developing website and mobile application projects, designing, as well as serving as a DevOps engineer managing servers using the Linux operating system and utilizing VMware for virtualization and cloud computing control.', 3),
(4, 'Ministry of Investment / BKPM', 'Technical Programmer (Directorate of Regional Potential Potential)', 'Jakarta, DKI Jakarta', 'Jan 2023', 'Dec 2023', 'I work part-time developing PIR (Regional Investment Potential) website applications. In developing the website applications, I use a tech stack that includes JavaScript, PHP Laravel, React (GatsbyJS) and C# .NET 5.0.', 4),
(5, 'PT. Diantama Sukses Mandiri', 'Fullstack Developer', 'Kebayoran Lama, South Jakarta', 'Jan 2017', 'Dec 2022', 'I work part-time at PT Diantama Sukses Mandiri. I built this app from scratch, created an ERD and created a business process and database. Projects include: Web Application (online learning and shopping using HTML, JavaScript frontend, PHP backend; previews: brazedplate.net, jualkomponen.com, heatexchangerspecialist.com, diantamasukses.com) and Mobile Application (React Native, OneSignal, Midtrans, RajaOngkir, GitHub).', 5);

-- --------------------------------------------------------

--
-- Struktur dari tabel `personal_info`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `personal_info`
--

INSERT INTO `personal_info` (`id`, `name`, `title`, `email`, `linkedin`, `github`, `location`, `about_me`, `portfolio_url`, `avatar_url`, `updated_at`) VALUES
(1, 'Fatih Syauqi', 'Software Engineer', 'fatihsyqi@gmail.com', 'https://www.linkedin.com/in/fatihsyauqi17', 'https://github.com/fatihsyauqi17', 'Bogor, Jawa Barat, ID', 'I am from Indonesia and working as a software engineer. I have 9 years of experience in developing mobile applications and websites. I am skilled in solving problems, eager to learn new technologies, and able to work effectively in a team. In addition, I am able to handle challenging tasks. See my web portfolio https://fatihsyauqi.my.id', 'https://fatihsyauqi.my.id', '/images/avatar.png', '2026-08-04 06:15:58');

-- --------------------------------------------------------

--
-- Struktur dari tabel `portfolios`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `portfolios`
--

INSERT INTO `portfolios` (`id`, `title`, `category`, `description`, `tech_stack`, `image_url`, `preview_url`, `created_at`) VALUES
(1, 'SIPINTAS - INFRASTRUKTUR PEMERINTAHAN', 'Mobile Application', 'An application to view Government Infrastructure Data in Border Areas. It helps central and regional governments determine policy formulation in infrastructure provision by presenting quality, accurate, real-time, and relevant data.', 'C#, Dotnet Web API, React Native', '/images/portfolio/sipintas.svg', '#', '2026-08-04 06:14:24'),
(2, 'SURLIS - PT. MASTER KOMPETEN INDONESIA', 'Mobile Application', 'A partner application of the Ministry of ATR/BPN serving requests for surveying, measuring, and mapping. It simplifies making land measurement requests, viewing licensed surveyor service offices (KJSB), and simulating land registration fees.', 'C#, Dotnet Web API, React Native', '/images/portfolio/surlis.svg', 'https://play.google.com/store/apps/details?id=com.maski.survei', '2026-08-04 06:14:24'),
(3, 'ASYSYIRKAH WEB ADMIN', 'Web Application', 'A web application developed for a Shariah investment finance system, enabling smooth administration of investments, transactions, and user management.', 'C#, Web API Dotnet, ReactJS', '/images/portfolio/asysyirkah.svg', 'https://koperasi.asysyirkah.com', '2026-08-04 06:14:24'),
(4, 'PIR - REGIONAL INVESTMENT POTENTIAL', 'Web Admin Application', 'A website application designed for promoting regional investment opportunities in government sectors, featuring interactive potential maps and regional analytics.', 'C#, Web API Dotnet, PHP Laravel', '/images/portfolio/pir.svg', 'https://regionalinvestment.bkpm.go.id', '2026-08-04 06:14:24'),
(5, 'S-ONE - SATUKAN DATA', 'Web Admin Application', 'The main product of PT Sawerigading Multi Kreasi. An information system for government data aggregation, storage, and visualization.', 'C#, Web API Dotnet, ReactJS, React Redux', '/images/portfolio/s-one.svg', 'https://s-one.swg.co.id', '2026-08-04 06:14:24'),
(6, 'SURVEY MUBA APP', 'Mobile Application', 'A mobile-based survey data collection system built for the Musi Banyuasin district community to gather public feedback and demographics.', 'C#, Web API Dotnet, React Native', '/images/portfolio/survey-muba.svg', 'https://s.id/MubaSurveiApp', '2026-08-04 06:14:24'),
(7, 'SINTA - SISTEM INFORMASI TALENTA', 'Web Admin Human Capital Application', 'An internal human capital management application developed for employees and talent tracking at PT Semen Indonesia Tbk (SIG).', 'C#, Web API Dotnet, Javascript, Jquery Ajax', '/images/portfolio/sinta.svg', 'https://sinta.sig.id', '2026-08-04 06:14:24'),
(8, 'SIGMA 2.0 - MANAGEMENT PORT', 'Web Management Port', 'An integrated port operation management portal developed in accordance with shipping and logistics standards at PT Semen Indonesia Tbk (SIG).', 'Web API Java Idempiere, ReactJS', '/images/portfolio/sigma.svg', 'https://scm.sig.id', '2026-08-04 06:14:24');

-- --------------------------------------------------------

--
-- Struktur dari tabel `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_highlight` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `skills`
--

INSERT INTO `skills` (`id`, `category`, `name`, `logo_url`, `sort_order`, `is_highlight`) VALUES
(1, 'Programming Languages', 'C#, ASP.NET, WebAPI', NULL, 1, 0),
(2, 'Programming Languages', 'PHP, CodeIgniter, Laravel', NULL, 2, 0),
(3, 'Programming Languages', 'HTML, JavaScript, jQuery, CSS, Bootstrap, Tailwind', NULL, 3, 0),
(4, 'Programming Languages', 'ReactJS and React Native', NULL, 4, 0),
(5, 'Programming Languages', 'PostgreSQL, MySQL', NULL, 5, 0),
(6, 'Programming Tools', 'Visual Studio, VS Code, Android Studio, Xcode, Visual Paradigm, Postman', NULL, 6, 0),
(7, 'Design Tools', 'Adobe Photoshop, Pencil', NULL, 7, 0),
(8, 'Others', 'Setting up web servers (Nginx, Apache)', NULL, 8, 0),
(9, 'Others', 'Setting up email servers (Zimbra)', NULL, 9, 0),
(10, 'Others', 'Public Speaking (Intermediate)', NULL, 10, 0),
(11, 'Others', 'Team Leader / Problem Solver (Intermediate)', NULL, 11, 0),
(12, 'Others', 'Bahasa Indonesia (Fluency or native language level)', NULL, 12, 0),
(13, 'Others', 'Language English (Intermediate)', NULL, 13, 0);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indeks untuk tabel `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indeks untuk tabel `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `education`
--
ALTER TABLE `education`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `experiences`
--
ALTER TABLE `experiences`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `personal_info`
--
ALTER TABLE `personal_info`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `portfolios`
--
ALTER TABLE `portfolios`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `education`
--
ALTER TABLE `education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `experiences`
--
ALTER TABLE `experiences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `personal_info`
--
ALTER TABLE `personal_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
