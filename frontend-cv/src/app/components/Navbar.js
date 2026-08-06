"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ContactModal from "./ContactModal";

export default function Navbar({ brandName }) {
  const [activeSection, setActiveSection] = useState("home");
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const sections = ["home", "profile", "skills", "experience", "portfolio", "blog"];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160; // offset for fixed navbar
      
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-nav fixed-top">
        <div className="container">
          <Link href="/" className="navbar-brand brand-signature text-decoration-none">
            {brandName || "Fatih Syauqi"}<span className="brand-dot">.</span>
          </Link>
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto gap-2 align-items-lg-center">
              <li className="nav-item">
                <a 
                  href="#home" 
                  className={`nav-link-custom ${activeSection === "home" ? "active" : ""}`}
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#profile" 
                  className={`nav-link-custom ${activeSection === "profile" ? "active" : ""}`}
                >
                  Profile
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#skills" 
                  className={`nav-link-custom ${activeSection === "skills" ? "active" : ""}`}
                >
                  Tech Stack
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#experience" 
                  className={`nav-link-custom ${activeSection === "experience" ? "active" : ""}`}
                >
                  Experiences
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#portfolio" 
                  className={`nav-link-custom ${activeSection === "portfolio" ? "active" : ""}`}
                >
                  Projects
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#blog" 
                  className={`nav-link-custom ${activeSection === "blog" ? "active" : ""}`}
                >
                  Articles
                </a>
              </li>
              {/* Highlighted Contact Button */}
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                  className="btn-warm-nav shadow-sm d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-envelope-fill"></i>
                  <span>Contact</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
