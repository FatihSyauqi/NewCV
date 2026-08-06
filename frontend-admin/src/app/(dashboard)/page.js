import { query } from "@/lib/db";
import Link from "next/link";

export const revalidate = 0;

async function getStats() {
  try {
    const portfolioCount = await query("SELECT COUNT(*) as count FROM portfolios");
    const blogCount = await query("SELECT COUNT(*) as count FROM blogs");
    const expCount = await query("SELECT COUNT(*) as count FROM experiences");
    const certCount = await query("SELECT COUNT(*) as count FROM certificates");
    const profile = await query("SELECT name, email, location, avatar_url FROM personal_info LIMIT 1");

    return {
      portfolios: portfolioCount[0]?.count || 0,
      blogs: blogCount[0]?.count || 0,
      experiences: expCount[0]?.count || 0,
      certificates: certCount[0]?.count || 0,
      profile: profile[0] || null
    };
  } catch (error) {
    console.error("Dashboard Stats Fetch Error:", error);
    return { portfolios: 0, blogs: 0, experiences: 0, certificates: 0, profile: null };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Overview of Fatih Syauqi's CV Website contents</p>
        </div>
        <div className="text-muted small">
          <i className="bi bi-clock me-1"></i> Local time: {new Date().toLocaleDateString("id-ID")}
        </div>
      </div>

      {/* Profile Overview Banner */}
      {stats.profile && (
        <div className="admin-card bg-white border border-warning-subtle p-4 mb-4">
          <div className="row align-items-center">
            <div className="col-auto">
              <img
                src={stats.profile.avatar_url ? (stats.profile.avatar_url.startsWith('http') || stats.profile.avatar_url.startsWith('/AdminFSyauqi') ? stats.profile.avatar_url : '/AdminFSyauqi' + stats.profile.avatar_url) : '/AdminFSyauqi/images/avatar.jpg'}
                alt={stats.profile.name}
                className="rounded-circle border border-3 border-warning shadow-sm"
                style={{ width: "70px", height: "70px", objectFit: "cover" }}
              />
            </div>
            <div className="col">
              <h2 className="h5 fw-bold text-dark mb-1">{stats.profile.name}</h2>
              <p className="text-muted-emphasis small mb-0">
                <i className="bi bi-envelope me-1"></i> {stats.profile.email} | <i className="bi bi-geo-alt me-1"></i> {stats.profile.location}
              </p>
            </div>
            <div className="col-auto mt-3 mt-sm-0">
              <Link href="/profile" className="btn btn-sm btn-primary-warm">
                <i className="bi bi-pencil me-1"></i> Edit Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="admin-card d-flex align-items-center gap-3">
            <div className="stat-icon">
              <i className="bi bi-briefcase"></i>
            </div>
            <div>
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Portfolios</small>
              <h3 className="h2 fw-bold text-dark mb-0">{stats.portfolios}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="admin-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-info-subtle text-info">
              <i className="bi bi-newspaper"></i>
            </div>
            <div>
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Blog Posts</small>
              <h3 className="h2 fw-bold text-dark mb-0">{stats.blogs}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="admin-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-success-subtle text-success">
              <i className="bi bi-list-task"></i>
            </div>
            <div>
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Experiences</small>
              <h3 className="h2 fw-bold text-dark mb-0">{stats.experiences}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="admin-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-patch-check"></i>
            </div>
            <div>
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Certificates</small>
              <h3 className="h2 fw-bold text-dark mb-0">{stats.certificates}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <h3 className="h5 fw-bold text-dark mb-3 mt-4">Quick Content Management</h3>
      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="admin-card p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <i className="bi bi-folder-plus fs-1 text-warning mb-2 d-block"></i>
              <h4 className="h6 fw-bold text-dark">Add New Portfolio</h4>
              <p className="small text-muted">Create a showcase card for mobile or web applications.</p>
            </div>
            <Link href="/portfolios" className="btn btn-sm btn-outline-warning w-100 mt-3">
              Go to Portfolios
            </Link>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="admin-card p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <i className="bi bi-file-earmark-plus fs-1 text-info mb-2 d-block"></i>
              <h4 className="h6 fw-bold text-dark">Write Blog Post</h4>
              <p className="small text-muted">Share developer insights or technical experiences.</p>
            </div>
            <Link href="/blogs" className="btn btn-sm btn-outline-info w-100 mt-3">
              Go to Blogs
            </Link>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="admin-card p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <i className="bi bi-sliders fs-1 text-success mb-2 d-block"></i>
              <h4 className="h6 fw-bold text-dark">Manage CV Sections</h4>
              <p className="small text-muted">Update work history timeline, school, and certificates.</p>
            </div>
            <Link href="/cv-sections" className="btn btn-sm btn-outline-success w-100 mt-3">
              Go to CV Sections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
