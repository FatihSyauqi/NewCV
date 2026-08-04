"use client";

import { useState } from "react";

export default function PortfolioGrid({ initialPortfolios }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get unique categories
  const categories = ["All", ...new Set(initialPortfolios.map((p) => p.category))];

  // Filter portfolios
  const filteredPortfolios = selectedCategory === "All"
    ? initialPortfolios
    : initialPortfolios.filter((p) => p.category === selectedCategory);

  return (
    <div>
      {/* Category Tabs */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Portfolios Grid */}
      <div className="row g-4">
        {filteredPortfolios.map((p) => (
          <div key={p.id} className="col-12 col-md-6 col-lg-4 d-flex">
            <div className="card-custom w-100 d-flex flex-column justify-content-between p-0 portfolio-card overflow-hidden">
              <div>
                <div className="portfolio-img-wrapper" style={{ height: "220px", position: "relative" }}>
                  <img
                    src={p.image_url || "/images/portfolio-placeholder.svg"}
                    alt={p.title}
                    className="w-100 h-100 object-fit-cover portfolio-img"
                  />
                  <div className="portfolio-overlay">
                    <h5 className="text-white mb-2">{p.title}</h5>
                    <p className="small text-white-50 mb-3">{p.category}</p>
                    <a
                      href={p.preview_url && p.preview_url !== "#" ? p.preview_url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn btn-sm btn-warm ${!p.preview_url || p.preview_url === "#" ? "disabled opacity-50" : ""}`}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Preview Link
                    </a>
                  </div>
                </div>
                <div className="p-4">
                  <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1 mb-2 rounded">
                    {p.category}
                  </span>
                  <h4 className="h5 mb-3" style={{ color: "var(--color-secondary)" }}>
                    {p.title}
                  </h4>
                  <p className="small text-muted" style={{ minHeight: "60px" }}>
                    {p.description}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <hr className="my-2 border-light-subtle" />
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {p.tech_stack.split(",").map((tech, idx) => (
                    <span
                      key={idx}
                      className="badge bg-body-secondary text-dark-emphasis font-monospace"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
