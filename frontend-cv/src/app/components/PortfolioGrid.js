"use client";

import { useState } from "react";

export default function PortfolioGrid({ initialPortfolios }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [btnHovered, setBtnHovered] = useState(false);

  // Statically limited categories as requested
  const categories = ["All", "Website", "Mobile Application"];

  // Normalize and filter portfolios to handle legacy items
  const filteredPortfolios = selectedCategory === "All"
    ? initialPortfolios
    : initialPortfolios.filter((p) => {
      const cat = p.category.toLowerCase().includes("mobile") ? "Mobile Application" : "Website";
      return cat === selectedCategory;
    });

  // Reset page when category changes
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Pagination constants & logic (max 6 portfolios per page as requested)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredPortfolios.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPortfolios.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      {/* Category Tabs */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Portfolios Grid */}
      <div className="row g-4">
        {currentItems.length > 0 ? (
          currentItems.map((p) => {
            const displayCategory = p.category.toLowerCase().includes("mobile") ? "Mobile Application" : "Website";
            return (
              <div key={p.id} className="col-12 col-md-6 col-lg-4 d-flex">
                <div
                  onClick={() => setSelectedPortfolio(p)}
                  className="card-custom w-100 d-flex flex-column justify-content-between p-0 portfolio-card overflow-hidden"
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <div className="portfolio-img-wrapper" style={{ height: "220px", position: "relative" }}>
                      <img
                        src={p.image_url || "/images/portfolio-placeholder.svg"}
                        alt={p.title}
                        className="w-100 h-100 object-fit-cover portfolio-img"
                      />
                      <div className="portfolio-overlay">
                        <h5 className="text-white mb-2">{p.title}</h5>
                        <p className="small text-white-50 mb-3">{displayCategory}</p>
                        <span className="btn btn-sm btn-warm">
                          <i className="bi bi-eye me-1"></i> View Details
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1 mb-2 rounded">
                        {displayCategory}
                      </span>
                      <h4 className="h5 mb-0" style={{ color: "var(--color-secondary)" }}>
                        {p.title}
                      </h4>
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
            );
          })
        ) : (
          <div className="col-12 text-center text-muted py-5">
            No portfolios found in this category.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
          <button
            className="btn btn-light rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <i className="bi bi-chevron-left fw-bold"></i>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`btn rounded-3 shadow-sm d-flex align-items-center justify-content-center ${currentPage === pageNum ? "fw-bold text-white" : "btn-light border border-light-subtle text-muted fw-bold"}`}
              style={{ 
                minWidth: "40px", 
                height: "40px", 
                transition: "all 0.2s ease", 
                cursor: "pointer",
                backgroundColor: currentPage === pageNum ? "var(--color-accent, #0284c7)" : "",
                borderColor: currentPage === pageNum ? "var(--color-accent, #0284c7)" : "",
                boxShadow: currentPage === pageNum ? "0 4px 12px rgba(2, 132, 199, 0.35)" : ""
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="btn btn-light rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <i className="bi bi-chevron-right fw-bold"></i>
          </button>
        </div>
      )}

      {/* Portfolio Detail Modal Popup */}
      {selectedPortfolio && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(15,23,42,0.65)", zIndex: 1050, backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg bg-white rounded-4 overflow-hidden">
              <div className="modal-header border-bottom border-light p-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark fs-4">{selectedPortfolio.title}</h5>
                <button type="button" className="btn-close" onClick={() => { setSelectedPortfolio(null); setBtnHovered(false); }} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-6 d-flex flex-column gap-3">
                    <div className="border rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center p-2" style={{ height: "260px" }}>
                      <img
                        src={selectedPortfolio.image_url || "/images/portfolio-placeholder.svg"}
                        alt={selectedPortfolio.title}
                        className="w-100 h-100 object-fit-contain"
                      />
                    </div>
                    {selectedPortfolio.preview_url && selectedPortfolio.preview_url !== "#" && (
                      <a
                        href={selectedPortfolio.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setBtnHovered(true)}
                        onMouseLeave={() => setBtnHovered(false)}
                        className="btn w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 text-white"
                        style={{
                          background: btnHovered
                            ? "linear-gradient(135deg, #0284c7 0%, #1e40af 100%)"
                            : "linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)",
                          border: "none",
                          borderRadius: "12px",
                          transform: btnHovered ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
                          boxShadow: btnHovered
                            ? "0 8px 24px rgba(2, 132, 199, 0.4)"
                            : "0 4px 12px rgba(2, 132, 199, 0.15)",
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          fontSize: "0.95rem",
                          letterSpacing: "0.5px"
                        }}
                      >
                        <i className={`bi bi-box-arrow-up-right fs-6 transition-transform ${btnHovered ? "translate-middle-y" : ""}`} style={{ transition: "transform 0.2s ease" }}></i>
                        Launch Project Preview
                      </a>
                    )}
                  </div>
                  <div className="col-md-6 d-flex flex-column justify-content-between">
                    <div>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-1.5 rounded-pill mb-3">
                        {selectedPortfolio.category.toLowerCase().includes("mobile") ? "Mobile Application" : "Website"}
                      </span>

                      <h6 className="fw-bold text-dark mb-2">Project Description</h6>
                      <p className="text-muted small mb-4" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                        {selectedPortfolio.description}
                      </p>

                      <h6 className="fw-bold text-dark mb-2">Tech Stack</h6>
                      <div className="d-flex flex-wrap gap-1.5 mb-4">
                        {selectedPortfolio.tech_stack.split(",").map((tech, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border border-light-subtle px-2.5 py-1.5 font-monospace"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top border-light p-3 bg-light text-end">
                <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => { setSelectedPortfolio(null); setBtnHovered(false); }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
