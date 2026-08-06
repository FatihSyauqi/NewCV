import { NextResponse } from "next/server";

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Fullstack CV & Portfolio Admin API Documentation",
    version: "1.0.0",
    description:
      "Dokumentasi lengkap RESTful API untuk Sistem Manajemen Fullstack CV & Portfolio Fatih Syauqi. Mengelola data profil, pengalaman, pendidikan, keahlian, portofolio, sertifikat, blog, serta pemrosesan pesan kontak dan autentikasi admin.",
    contact: {
      name: "Fatih Syauqi",
      email: "fatihsyqi@gmail.com",
    },
  },
  servers: [
    {
      url: "http://127.0.0.1:3002/AdminFSyauqi",
      description: "Local Admin API Server (Port 3002 with /AdminFSyauqi basePath)",
    },
    {
      url: "http://localhost:3002/AdminFSyauqi",
      description: "Localhost Admin API Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Endpoint Autentikasi Admin & Session" },
    { name: "Public Contact", description: "Endpoint Form Kontak Publik & Telegram Bot" },
    { name: "Inquiries", description: "Manajemen Pesan Kontak & Hapus File" },
    { name: "Profile", description: "Manajemen Informasi Diri / Personal Info" },
    { name: "Experiences", description: "Manajemen Pengalaman Kerja" },
    { name: "Education", description: "Manajemen Riwayat Pendidikan" },
    { name: "Skills", description: "Manajemen Keahlian & Tech Stack" },
    { name: "Certificates", description: "Manajemen Lisensi & Sertifikasi" },
    { name: "Portfolios", description: "Manajemen Proyek Portofolio" },
    { name: "Blogs", description: "Manajemen Artikel & Publikasi Blog" },
    { name: "Upload", description: "Endpoint Upload File & Gambar" },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login Admin",
        description: "Melakukan otentikasi admin menggunakan username dan password. Mengembalikan JWT Token dan mengeset HTTP-Only cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "admin123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login berhasil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
                  },
                },
              },
            },
          },
          401: { description: "Username atau Password salah" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout Admin",
        description: "Menghapus sesi login admin dan mengosongkan cookie autentikasi.",
        responses: {
          200: {
            description: "Logout berhasil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Logged out successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/contact": {
      post: {
        tags: ["Public Contact"],
        summary: "Submit Form Kontak Publik & Lampiran",
        description:
          "Memproses formulir kontak dari pengguna publik di frontend CV. Melakukan sanitasi HTML, validasi nomor telepon & email, verifikasi Math Captcha, menyimpan pesan dan file ke MySQL (`contact_inquiries` & `contact_inquiries_files`), serta meneruskan pesan & lampiran file ke Telegram Bot.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "purpose", "phone", "email", "message", "captcha_num1", "captcha_num2", "captcha_answer"],
                properties: {
                  name: { type: "string", example: "Fariz Hanif Arrayhan", description: "Nama Lengkap Pengirim (Format Title Case)" },
                  purpose: { type: "string", example: "Contract / Project Development", description: "Tujuan Kontak" },
                  other_purpose: { type: "string", example: "Integrasi API Enterprise", description: "Detail tujuan jika memilih Lainnya" },
                  phone: { type: "string", example: "+6281234567890", description: "Nomor HP dengan Kode Negara (e.g. +62)" },
                  email: { type: "string", example: "fariz@domain.com", description: "Alamat Email Valid" },
                  company_name: { type: "string", example: "PT Teknologi Nusantara", description: "Nama Perusahaan / Usaha (Opsional)" },
                  message: { type: "string", example: "Halo, saya tertarik berkonsultasi mengenai arsitektur sistem.", description: "Isi Pesan" },
                  captcha_num1: { type: "integer", example: 3, description: "Angka Pertama Captcha" },
                  captcha_num2: { type: "integer", example: 5, description: "Angka Kedua Captcha" },
                  captcha_answer: { type: "integer", example: 8, description: "Jawaban Matematika Captcha" },
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Lampiran File PDF / Gambar (Maks 2MB per file)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Pesan berhasil terkirim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Pesan Anda berhasil terkirim!" },
                    id: { type: "integer", example: 12 },
                  },
                },
              },
            },
          },
          400: { description: "Validasi gagal (Captcha salah, format email/phone tidak valid, file > 2MB)" },
        },
      },
    },
    "/api/inquiries": {
      get: {
        tags: ["Inquiries"],
        summary: "Mendapatkan Semua Pesan Kontak Inquiries",
        description: "Mengambil daftar pesan masuk dari pengunjung web beserta daftar file lampirannya.",
        responses: {
          200: { description: "Daftar inquiries berhasil diambil" },
        },
      },
      delete: {
        tags: ["Inquiries"],
        summary: "Hapus Pesan Kontak & Cleanup File Fisik",
        description: "Menghapus pesan inquiry berdasarkan ID dari database sekaligus menghapus file lampirannya dari disk secara fisik.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "integer", example: 5 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Inquiry dan file fisik berhasil dihapus" },
        },
      },
    },
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "Ambil Informasi Profil Diri",
        responses: { 200: { description: "Data profil berhasil diambil" } },
      },
      put: {
        tags: ["Profile"],
        summary: "Perbarui Informasi Profil Diri",
        responses: { 200: { description: "Data profil berhasil diperbarui" } },
      },
    },
    "/api/experiences": {
      get: {
        tags: ["Experiences"],
        summary: "Daftar Pengalaman Kerja",
        responses: { 200: { description: "Daftar pengalaman kerja" } },
      },
      post: {
        tags: ["Experiences"],
        summary: "Tambah Pengalaman Kerja Baru",
        responses: { 201: { description: "Pengalaman kerja berhasil ditambahkan" } },
      },
    },
    "/api/experiences/{id}": {
      put: {
        tags: ["Experiences"],
        summary: "Update Pengalaman Kerja",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Pengalaman kerja berhasil diperbarui" } },
      },
      delete: {
        tags: ["Experiences"],
        summary: "Hapus Pengalaman Kerja",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Pengalaman kerja berhasil dihapus" } },
      },
    },
    "/api/education": {
      get: {
        tags: ["Education"],
        summary: "Daftar Riwayat Pendidikan",
        responses: { 200: { description: "Daftar pendidikan" } },
      },
      post: {
        tags: ["Education"],
        summary: "Tambah Riwayat Pendidikan Baru",
        responses: { 201: { description: "Pendidikan berhasil ditambahkan" } },
      },
    },
    "/api/skills": {
      get: {
        tags: ["Skills"],
        summary: "Daftar Keahlian & Tech Stack",
        responses: { 200: { description: "Daftar skills" } },
      },
      post: {
        tags: ["Skills"],
        summary: "Tambah Keahlian Baru",
        responses: { 201: { description: "Skill berhasil ditambahkan" } },
      },
    },
    "/api/certificates": {
      get: {
        tags: ["Certificates"],
        summary: "Daftar Sertifikat & Lisensi",
        responses: { 200: { description: "Daftar sertifikat" } },
      },
      post: {
        tags: ["Certificates"],
        summary: "Tambah Sertifikat Baru",
        responses: { 201: { description: "Sertifikat berhasil ditambahkan" } },
      },
    },
    "/api/portfolios": {
      get: {
        tags: ["Portfolios"],
        summary: "Daftar Proyek Portofolio",
        responses: { 200: { description: "Daftar proyek portofolio" } },
      },
      post: {
        tags: ["Portfolios"],
        summary: "Tambah Proyek Portofolio Baru",
        responses: { 201: { description: "Proyek portofolio berhasil ditambahkan" } },
      },
    },
    "/api/blogs": {
      get: {
        tags: ["Blogs"],
        summary: "Daftar Artikel Blog",
        responses: { 200: { description: "Daftar artikel blog" } },
      },
      post: {
        tags: ["Blogs"],
        summary: "Tambah Artikel Blog Baru",
        responses: { 201: { description: "Artikel blog berhasil ditambahkan" } },
      },
    },
    "/api/upload": {
      post: {
        tags: ["Upload"],
        summary: "Upload Gambar / File Asset",
        responses: { 200: { description: "File berhasil diunggah" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}
