"use client";

import { useState } from "react";

export default function SeoSettingsClient({ initialSeo }) {
  const [formData, setFormData] = useState({
    meta_title: initialSeo?.meta_title || "Fatih Syauqi - Senior Software Engineer & Web Mobile App Developer",
    meta_description: initialSeo?.meta_description || "Jasa Pembuatan Website, Aplikasi Mobile (React Native), & API Gateway Enterprise oleh Fatih Syauqi - Senior Software Engineer 9+ tahun pengalaman (.NET C#, PHP Laravel, ReactJS). Siap bekerjasama dengan perusahaan & bisnis.",
    meta_keywords: initialSeo?.meta_keywords || "Software Engineer Indonesia, Jasa Pembuatan Aplikasi, Fullstack Developer, React Native Engineer, ASP.NET Developer, Hire Software Engineer, IT Consultant, Web Developer Bogor Jakarta",
    og_title: initialSeo?.og_title || "Fatih Syauqi - Senior Software Engineer & Enterprise App Developer",
    og_description: initialSeo?.og_description || "Portofolio & CV Fatih Syauqi, Software Engineer berpengalaman dalam membangun aplikasi web & mobile scalable untuk perusahaan dan bisnis.",
    og_image: initialSeo?.og_image || "/uploads/profile/avatar-2eb0.png",
    canonical_url: initialSeo?.canonical_url || "https://fatihsyauqi.my.id",
    author_name: initialSeo?.author_name || "Fatih Syauqi",
    job_title: initialSeo?.job_title || "Senior Software Engineer",
    target_services: initialSeo?.target_services || "Software Architecture, Web Application Development, Mobile App Development, Cloud DevOps, System Integration"
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/AdminFSyauqi/api/seo-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memperbarui pengaturan SEO");

      setMessage(result.message || "Pengaturan SEO berhasil diperbarui!");
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayUrl = formData.canonical_url || "https://fatihsyauqi.my.id";

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold">
            <i className="bi bi-search-heart text-primary me-2"></i>
            Pengaturan SEO & Visibilitas Perusahaan
          </h1>
          <p className="text-muted small mb-0">
            Kelola meta tags, keyword penawaran jasa/layanan untuk pengusaha &amp; perusahaan, serta OpenGraph media sosial.
          </p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'general' ? 'active fw-bold border-bottom-0' : 'text-secondary'}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="bi bi-sliders me-2"></i>
            Meta Search Engine
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'social' ? 'active fw-bold border-bottom-0' : 'text-secondary'}`}
            onClick={() => setActiveTab('social')}
          >
            <i className="bi bi-share me-2"></i>
            Social Share Cards (OpenGraph)
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'preview' ? 'active fw-bold border-bottom-0' : 'text-secondary'}`}
            onClick={() => setActiveTab('preview')}
          >
            <i className="bi bi-eye me-2"></i>
            Live SERP &amp; Social Preview
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* TAB 1: General Meta Tags */}
            {activeTab === "general" && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                  <h2 className="h6 mb-0 text-dark fw-bold">
                    <i className="bi bi-google me-2 text-primary"></i>
                    Google Meta Tags &amp; Target Keywords
                  </h2>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Meta Title (Judul di Pencarian Google) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      placeholder="e.g. Fatih Syauqi - Senior Software Engineer & Web Developer"
                      maxLength={70}
                      required
                    />
                    <div className="d-flex justify-content-between form-text">
                      <span>Rekomendasi 50 - 60 karakter untuk hasil optimal di Google.</span>
                      <span className={formData.meta_title.length > 60 ? "text-danger" : "text-muted"}>
                        {formData.meta_title.length}/70
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Meta Description (Deskripsi Ringkas di Google) <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="meta_description"
                      rows={4}
                      value={formData.meta_description}
                      onChange={handleChange}
                      placeholder="Deskripsi menarik yang mendorong recruiter / perusahaan mengklik situs Anda..."
                      maxLength={160}
                      required
                    />
                    <div className="d-flex justify-content-between form-text">
                      <span>Rekomendasi 120 - 160 karakter agar tidak terpotong di Google.</span>
                      <span className={formData.meta_description.length > 160 ? "text-danger" : "text-muted"}>
                        {formData.meta_description.length}/160
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Meta Keywords (Target Kata Kunci B2B &amp; Perusahaan)
                    </label>
                    <textarea
                      className="form-control"
                      name="meta_keywords"
                      rows={3}
                      value={formData.meta_keywords}
                      onChange={handleChange}
                      placeholder="Pisahkan dengan koma: Software Engineer, Jasa Web Developer, Hire Fullstack Engineer..."
                    />
                    <div className="form-text">
                      Kata kunci pencarian yang sering digunakan oleh HR / Recruiter / Pengusaha (misal: <em>Jasa Pembuatan Aplikasi, Hire Software Developer, React Native Engineer</em>).
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Author Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="author_name"
                        value={formData.author_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Job Title / Profesi</label>
                      <input
                        type="text"
                        className="form-control"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-semibold">Canonical Domain URL</label>
                    <input
                      type="url"
                      className="form-control"
                      name="canonical_url"
                      value={formData.canonical_url}
                      onChange={handleChange}
                      placeholder="https://fatihsyauqi.my.id"
                    />
                    <div className="form-text">URL resmi domain portfolio tempat sitemap &amp; canonical link bermuara.</div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-semibold">Layanan / Jasa Utama untuk Perusahaan (Target Services)</label>
                    <textarea
                      className="form-control"
                      name="target_services"
                      rows={3}
                      value={formData.target_services}
                      onChange={handleChange}
                      placeholder="Software Architecture, Web App Development, Mobile App Development, Cloud DevOps..."
                    />
                    <div className="form-text">Layanan ini akan otomatis dimasukkan ke Schema.org ProfessionalService untuk indexing Google.</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Social Share Cards (OpenGraph) */}
            {activeTab === "social" && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                  <h2 className="h6 mb-0 text-dark fw-bold">
                    <i className="bi bi-linkedin me-2 text-primary"></i>
                    OpenGraph &amp; Social Share Cards (LinkedIn, WhatsApp, Twitter)
                  </h2>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">OpenGraph Title (Judul Saat Di-share)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="og_title"
                      value={formData.og_title}
                      onChange={handleChange}
                      placeholder="Judul untuk tampilan LinkedIn & Twitter card"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">OpenGraph Description</label>
                    <textarea
                      className="form-control"
                      name="og_description"
                      rows={3}
                      value={formData.og_description}
                      onChange={handleChange}
                      placeholder="Ringkasan profil & keahlian untuk tampilan link preview..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">OpenGraph Image URL (Gambar Social Card)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="og_image"
                      value={formData.og_image}
                      onChange={handleChange}
                      placeholder="/uploads/profile/avatar-2eb0.png atau URL gambar banner"
                    />
                    <div className="form-text">
                      Path relatif atau URL gambar banner berukuran 1200x630 pixel untuk hasil terbaik di LinkedIn &amp; WhatsApp.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Live Preview */}
            {activeTab === "preview" && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                  <h2 className="h6 mb-0 text-dark fw-bold">
                    <i className="bi bi-laptop me-2 text-success"></i>
                    Simulasi Tampilan di Hasil Pencarian &amp; Media Sosial
                  </h2>
                </div>
                <div className="card-body p-4">
                  {/* Google SERP Preview Card */}
                  <h3 className="h6 text-muted uppercase font-monospace mb-3">
                    <i className="bi bi-google text-danger me-1"></i> TAMPILAN GOOGLE SEARCH RESULT
                  </h3>
                  <div className="p-3 bg-white border rounded shadow-xs mb-4" style={{ maxWidth: "600px" }}>
                    <div className="d-flex align-items-center mb-1 gap-2">
                      <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                        <i className="bi bi-globe text-primary" style={{ fontSize: "12px" }}></i>
                      </div>
                      <div className="lh-1">
                        <div className="fw-semibold text-dark fs-7">{formData.author_name || "Fatih Syauqi"}</div>
                        <div className="text-success small" style={{ fontSize: "12px" }}>{displayUrl}</div>
                      </div>
                    </div>
                    <div className="text-primary text-decoration-none h5 mb-1" style={{ cursor: "pointer", color: "#1a0dab" }}>
                      {formData.meta_title || "Fatih Syauqi - Senior Software Engineer"}
                    </div>
                    <p className="text-secondary small mb-0" style={{ color: "#4d5156", fontSize: "13px", lineHeight: "1.4" }}>
                      {formData.meta_description || "Deskripsi meta pencarian Google..."}
                    </p>
                  </div>

                  {/* LinkedIn / Social Card Preview */}
                  <h3 className="h6 text-muted uppercase font-monospace mb-3">
                    <i className="bi bi-linkedin text-primary me-1"></i> TAMPILAN LINKEDIN / WHATSAPP SHARE CARD
                  </h3>
                  <div className="border rounded-3 overflow-hidden shadow-xs bg-light" style={{ maxWidth: "520px" }}>
                    <div
                      className="bg-dark d-flex align-items-center justify-content-center text-white"
                      style={{ height: "220px", backgroundSize: "cover", backgroundPosition: "center", backgroundImage: formData.og_image ? `url(${formData.og_image})` : undefined }}
                    >
                      {!formData.og_image && (
                        <div className="text-center p-3">
                          <i className="bi bi-image text-muted fs-1 d-block mb-1"></i>
                          <small className="text-muted">Preview Banner Preview</small>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white border-top">
                      <small className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                        {new URL(displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`).hostname}
                      </small>
                      <h4 className="h6 fw-bold text-dark mb-1">
                        {formData.og_title || formData.meta_title}
                      </h4>
                      <p className="text-muted small mb-0 text-truncate">
                        {formData.og_description || formData.meta_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="d-flex align-items-center gap-3 mb-5">
              <button
                type="submit"
                className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-floppy"></i>
                    <span>Simpan Pengaturan SEO</span>
                  </>
                )}
              </button>
              <small className="text-muted">Perubahan akan langsung diterapkan ke metadata &amp; sitemap website CV.</small>
            </div>
          </div>

          {/* Right Info Column */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 mb-4 bg-light">
              <div className="card-body p-4">
                <h3 className="h6 fw-bold text-dark mb-3">
                  <i className="bi bi-lightbulb text-warning me-2"></i>
                  Tips SEO untuk Target Perusahaan &amp; Pengusaha
                </h3>
                <ul className="small text-secondary ps-3 mb-0" style={{ lineHeight: "1.7" }}>
                  <li className="mb-2">
                    <strong>Gunakan Kata Kunci Spesifik:</strong> Sertakan teknologi utama seperti <em>.NET C#, React Native, PHP Laravel, Microservices</em> yang sering dicari tim HR &amp; Tech Lead.
                  </li>
                  <li className="mb-2">
                    <strong>Tentukan Nilai Tambah:</strong> Tuliskan total pengalaman (misal: <em>9+ Tahun Pengalaman</em>) dan spesialisasi sistem scalable untuk menarik perhatian perusahaan enterprise.
                  </li>
                  <li className="mb-2">
                    <strong>Tawar Jasa / Konsultasi:</strong> Tambahkan keyword pencarian lokal seperti <em>Jasa Pembuatan Aplikasi Mobile Bogor Jakarta</em> agar mudah ditemukan pengusaha lokal.
                  </li>
                  <li>
                    <strong>Sitemap &amp; Schema:</strong> Website CV Anda telah secara otomatis menghasilkan <code>/sitemap.xml</code> dan <code>Schema.org JSON-LD</code> untuk indexing Google.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
