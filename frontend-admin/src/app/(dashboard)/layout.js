"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/AdminFSyauqi/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: "bi-speedometer2" },
    { href: "/profile", label: "Profile Info", icon: "bi-person-gear" },
    { href: "/portfolios", label: "Portfolios", icon: "bi-briefcase" },
    { href: "/blogs", label: "Blogs/Articles", icon: "bi-newspaper" },
    { href: "/cv-sections", label: "CV Sections", icon: "bi-list-stars" },
    { href: "/inquiries", label: "Contact Inquiries", icon: "bi-envelope-paper" },
  ];

  return (
    <div className="admin-shell">
      {/* ── Mobile Top Bar ── */}
      <header className="admin-topbar d-flex d-md-none align-items-center justify-content-between px-3 py-2">
        <span className="font-serif fw-bold text-white fs-5">
          Admin Panel<span className="text-warning">.</span>
        </span>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"} fs-5`}></i>
        </button>
      </header>

      {/* ── Backdrop overlay (mobile only) ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop d-md-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-body">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          {/* Brand (desktop only — mobile has topbar) */}
          <div className="sidebar-header text-center d-none d-md-block">
            <span className="font-serif fw-bold text-white fs-4">
              Admin Panel<span className="text-warning">.</span>
            </span>
            <small className="d-block text-muted mt-1">CV Dashboard</small>
          </div>

          {/* Mobile brand inside drawer */}
          <div className="sidebar-header text-center d-md-none">
            <span className="font-serif fw-bold text-white fs-5">
              Admin Panel<span className="text-warning">.</span>
            </span>
            <small className="d-block text-muted mt-1">CV Dashboard</small>
          </div>

          <nav className="w-100 mt-2">
            <ul className="nav flex-column w-100">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href} className="nav-item">
                    <Link
                      href={link.href}
                      className={`nav-link ${isActive ? "active text-white" : ""}`}
                    >
                      <i className={`bi ${link.icon}`}></i>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout / User Info */}
          <div className="p-3 w-100 border-top border-secondary-subtle mt-auto">
            <div className="d-flex align-items-center gap-2 mb-3 px-3 text-white-50">
              <i className="bi bi-circle-fill text-success" style={{ fontSize: "0.6rem" }}></i>
              <small className="fw-semibold text-white">Administrator</small>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
              disabled={loggingOut}
            >
              {loggingOut ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <>
                  <i className="bi bi-box-arrow-left"></i>
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="admin-main">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
