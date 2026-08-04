-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS db_cv_fatih;
USE db_cv_fatih;

-- Table for Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Personal Information
CREATE TABLE IF NOT EXISTS personal_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    linkedin VARCHAR(255),
    github VARCHAR(255),
    location VARCHAR(100),
    about_me TEXT,
    portfolio_url VARCHAR(255),
    avatar_url VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for Experiences
CREATE TABLE IF NOT EXISTS experiences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0
);

-- Table for Education
CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school VARCHAR(150) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    major VARCHAR(100) NOT NULL,
    gpa VARCHAR(20),
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0
);

-- Table for Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    issuer VARCHAR(150) NOT NULL,
    credential_id VARCHAR(100),
    issue_date VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- Table for Skills
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- e.g., 'Programming Languages', 'Programming Tools', 'Design Tools', 'Others'
    name VARCHAR(255) NOT NULL
);

-- Table for Portfolios (with image, description, and preview link)
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100), -- e.g., 'Web Application', 'Mobile Application'
    description TEXT,
    tech_stack VARCHAR(255),
    image_url VARCHAR(255),
    preview_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Blogs/Articles
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'published', -- 'draft' or 'published'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- SEED DATA
-- --------------------------------------------------------

-- Seed Admin User (Username: admin, Password: admin123, Bcrypt Hash)
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$0PixwA6.d21UWPbLXJVV7.eX.LVGWKYbKQHwIarnC5iZME/ZLlp3K')
ON DUPLICATE KEY UPDATE username=username;

-- Seed Personal Information
INSERT INTO personal_info (id, name, title, email, linkedin, github, location, about_me, portfolio_url, avatar_url)
VALUES (1, 
        'Fatih Syauqi', 
        'Senior Software Engineer', 
        'fatihsyqi@gmail.com', 
        'https://www.linkedin.com/in/fatihsyauqi17', 
        'https://github.com/fatihsyauqi17', 
        'Bogor, Jawa Barat, ID', 
        'I am from Indonesia and working as a software engineer. I have 9 years of experience in developing mobile applications and websites. I am skilled in solving problems, eager to learn new technologies, and able to work effectively in a team. In addition, I am able to handle challenging tasks. See my web portfolio https://fatihsyauqi.my.id',
        'https://fatihsyauqi.my.id',
        '/images/avatar.jpg')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Experiences
INSERT INTO experiences (company, role, location, start_date, end_date, description, sort_order) VALUES
('PT. BERLIAN SISTEM INFORMASI', 'Software Engineer', 'Jakarta, DKI Jakarta', 'Dec 2025', 'Now', 'Responsible for supporting operations and handling change requests using a technology stack that includes .NET Core, ReactJS, SQL Server, Azure DevOps, PAM 360, Docker Container, and Flutter.', 1),
('PT. SINERGI INFORMATITAS SEMEN INDONESIA', 'Fullstack Developer', 'Jakarta, DKI Jakarta', 'Aug 2024', 'Nov 2025', 'Developing and maintaining web applications for corporate clients, including human capital systems (SINTA) and port management operations (SIGMA 2.0). Utilized technologies such as C#, .NET Web API, JavaScript, jQuery Ajax, Java Idempiere, and ReactJS.', 2),
('PT. SAWERIGADING MULTI KREASI', 'Software Engineer', 'Bogor, Jawa Barat', 'Feb 2019', 'July 2024', 'I work full-time at PT Sawerigading Multi Kreasi (Software House) as a software engineer. My responsibilities include developing website and mobile application projects, designing, as well as serving as a DevOps engineer managing servers using the Linux operating system and utilizing VMware for virtualization and cloud computing control.', 3),
('MINISTRY OF INVESTMENT / BKPM', 'Technical Programmer (Directorate of Regional Potential Potential)', 'Jakarta, DKI Jakarta', 'Jan 2023', 'Dec 2023', 'I work part-time developing PIR (Regional Investment Potential) website applications. In developing the website applications, I use a tech stack that includes JavaScript, PHP Laravel, React (GatsbyJS) and C# .NET 5.0.', 4),
('DIANTAMA SUKSES MANDIRI', 'Fullstack Developer', 'Kebayoran Lama, South Jakarta', 'Jan 2017', 'Dec 2022', 'I work part-time at PT Diantama Sukses Mandiri. I built this app from scratch, created an ERD and created a business process and database. Projects include: Web Application (online learning and shopping using HTML, JavaScript frontend, PHP backend; previews: brazedplate.net, jualkomponen.com, heatexchangerspecialist.com, diantamasukses.com) and Mobile Application (React Native, OneSignal, Midtrans, RajaOngkir, GitHub).', 5);

-- Seed Education
INSERT INTO education (school, degree, major, gpa, start_date, end_date, sort_order) VALUES
('STIKOM BINANIAGA BOGOR / UNIVERSITY OF BINANIAGA INDONESIA', 'Bachelor\'s Degree', 'Informatics Engineering', '3.53 from 4.00', 'Sept 2015', 'Jan 2020', 1);

-- Seed Certificates
INSERT INTO certificates (title, issuer, credential_id, issue_date, sort_order) VALUES
('KEYWORD RESEARCH COURSE WITH GREG GIFFORD', 'Semrush.com', '415701', '2023', 1),
('CERTIFIED WEB DEVELOPER (CWDEV)', 'Badan Nasional Sertifikasi Profesi (BNSP)', '62019 2513 6 0028243 2024', '2024', 2);

-- Seed Skills
INSERT INTO skills (category, name) VALUES
('Programming Languages', 'C#, ASP.NET, WebAPI'),
('Programming Languages', 'PHP, CodeIgniter, Laravel'),
('Programming Languages', 'HTML, JavaScript, jQuery, CSS, Bootstrap, Tailwind'),
('Programming Languages', 'ReactJS and React Native'),
('Programming Languages', 'PostgreSQL, MySQL'),
('Programming Tools', 'Visual Studio, VS Code, Android Studio, Xcode, Visual Paradigm, Postman'),
('Design Tools', 'Adobe Photoshop, Pencil'),
('Others', 'Setting up web servers (Nginx, Apache)'),
('Others', 'Setting up email servers (Zimbra)'),
('Others', 'Public Speaking (Intermediate)'),
('Others', 'Team Leader / Problem Solver (Intermediate)'),
('Others', 'Bahasa Indonesia (Fluency or native language level)'),
('Others', 'Language English (Intermediate)');

-- Seed Portfolios
INSERT INTO portfolios (title, category, description, tech_stack, image_url, preview_url) VALUES
('SIPINTAS - INFRASTRUKTUR PEMERINTAHAN', 'Mobile Application', 'An application to view Government Infrastructure Data in Border Areas. It helps central and regional governments determine policy formulation in infrastructure provision by presenting quality, accurate, real-time, and relevant data.', 'C#, Dotnet Web API, React Native', '/images/portfolio/sipintas.jpg', '#'),
('SURLIS - PT. MASTER KOMPETEN INDONESIA', 'Mobile Application', 'A partner application of the Ministry of ATR/BPN serving requests for surveying, measuring, and mapping. It simplifies making land measurement requests, viewing licensed surveyor service offices (KJSB), and simulating land registration fees.', 'C#, Dotnet Web API, React Native', '/images/portfolio/surlis.jpg', 'https://play.google.com/store/apps/details?id=com.maski.survei'),
('ASYSYIRKAH WEB ADMIN', 'Web Application', 'A web application developed for a Shariah investment finance system, enabling smooth administration of investments, transactions, and user management.', 'C#, Web API Dotnet, ReactJS', '/images/portfolio/asysyirkah.jpg', 'https://koperasi.asysyirkah.com'),
('PIR - REGIONAL INVESTMENT POTENTIAL', 'Web Admin Application', 'A website application designed for promoting regional investment opportunities in government sectors, featuring interactive potential maps and regional analytics.', 'C#, Web API Dotnet, PHP Laravel', '/images/portfolio/pir.jpg', 'https://regionalinvestment.bkpm.go.id/pir'),
('S-ONE - SATUKAN DATA', 'Web Admin Application', 'The main product of PT Sawerigading Multi Kreasi. An information system for government data aggregation, storage, and visualization.', 'C#, Web API Dotnet, ReactJS, React Redux', '/images/portfolio/s-one.jpg', 'https://s-one.swg.co.id'),
('SURVEY MUBA APP', 'Mobile Application', 'A mobile-based survey data collection system built for the Musi Banyuasin district community to gather public feedback and demographics.', 'C#, Web API Dotnet, React Native', '/images/portfolio/survey-muba.jpg', 'https://s.id/MubaSurveiApp'),
('SINTA - SISTEM INFORMASI TALENTA', 'Web Admin Human Capital Application', 'An internal human capital management application developed for employees and talent tracking at PT Semen Indonesia Tbk (SIG).', 'C#, Web API Dotnet, Javascript, Jquery Ajax', '/images/portfolio/sinta.jpg', 'https://sinta.sig.id'),
('SIGMA 2.0 - MANAGEMENT PORT', 'Web Management Port', 'An integrated port operation management portal developed in accordance with shipping and logistics standards at PT Semen Indonesia Tbk (SIG).', 'Web API Java Idempiere, ReactJS', '/images/portfolio/sigma.jpg', 'https://scm.sig.id');

-- Seed Blogs
INSERT INTO blogs (title, slug, excerpt, content, image_url, category) VALUES
('Membangun Arsitektur Microservices dengan Dotnet Web API', 'membangun-arsitektur-microservices-dotnet-web-api', 'Pelajari cara merancang API gateway dan microservices menggunakan C# dan Dotnet Web API yang modular dan scalable.', 'Di dunia rekayasa perangkat lunak modern, arsitektur microservices menjadi pilihan utama untuk sistem skala besar. C# .NET Web API menyediakan tools yang matang untuk membuat service berkinerja tinggi.\n\n### Mengapa memilih .NET untuk Microservices?\n1. **Kinerja Tinggi**: Kestrel server sangat cepat.\n2. **Cross-Platform**: Berjalan mulus di Linux container (Docker).\n3. **Ekosistem Kuat**: Dukungan pustaka dependency injection dan ORM bawaan.\n\nDalam artikel ini, kita akan membahas cara mengimplementasikan API Gateway dengan Ocelot dan service penunjang lainnya...', '/images/blog/dotnet-microservices.jpg', 'Backend Development'),
('Tips Integrasi React Native dengan REST API Berbasis JWT', 'tips-integrasi-react-native-rest-api-jwt', 'Panduan praktis mengamankan otentikasi REST API di aplikasi mobile Android & iOS menggunakan React Native.', 'Mengelola state otentikasi di React Native memerlukan perhatian khusus pada keamanan penyimpanan token (Access Token & Refresh Token).\n\n### Gunakan Secure Storage\nHindari menggunakan AsyncStorage biasa untuk menyimpan token JWT. Lebih baik gunakan:\n* `react-native-keychain` untuk Android Keystore & iOS Keychain.\n* Integrasi library yang didukung enkripsi bawaan.\n\nMari kita lihat contoh konfigurasi Axios interceptor untuk menangani request dengan Authorization Header secara dinamis...', '/images/blog/react-native-jwt.jpg', 'Mobile Development');
