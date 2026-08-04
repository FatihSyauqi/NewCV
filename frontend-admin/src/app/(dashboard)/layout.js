"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/admin/api/auth/logout", { method: "POST" });
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
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2 px-0 sidebar d-flex flex-column justify-content-between position-fixed top-0 start-0">
          <div className="w-100">
            <div className="sidebar-header text-center">
              <span className="font-serif fw-bold text-white fs-4">
                Admin Panel<span className="text-warning">.</span>
              </span>
              <small className="d-block text-muted mt-1">CV Dashboard</small>
            </div>
            
            <ul className="nav flex-column w-100 mt-3">
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
          </div>

          {/* Logout / User Info */}
          <div className="p-3 w-100 border-top border-secondary-subtle" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
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
        </div>

        {/* Main Content Area */}
        <div className="col-12 col-md-9 col-lg-10 offset-md-3 offset-lg-2 px-0">
          <div className="main-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
