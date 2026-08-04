"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortfoliosClient({ initialPortfolios }) {
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Web Application");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setTitle("");
    setCategory("Web Application");
    setDescription("");
    setTechStack("");
    setImageUrl("");
    setPreviewUrl("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setDescription(p.description);
    setTechStack(p.tech_stack);
    setImageUrl(p.image_url);
    setPreviewUrl(p.preview_url);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      category,
      description,
      tech_stack: techStack,
      image_url: imageUrl || undefined,
      preview_url: previewUrl || "#"
    };

    try {
      let response;
      if (editingId) {
        // Edit Mode
        response = await fetch(`/api/portfolios/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Add Mode
        response = await fetch("/api/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save portfolio");
      }

      // Reload lists
      const fetchRes = await fetch("/api/portfolios");
      const list = await fetchRes.json();
      setPortfolios(list);

      resetForm();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return;

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete portfolio");
      }

      setPortfolios((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header with actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Manage Portfolios</h1>
          <p className="text-muted mb-0">Add, edit, or remove project showcases</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary-warm">
            <i className="bi bi-plus-lg me-1"></i> Add Portfolio
          </button>
        )}
      </div>

      {/* Form Card (Add/Edit) */}
      {showForm && (
        <div className="admin-card">
          <h2 className="h5 fw-bold mb-4 text-dark">
            {editingId ? `Edit Portfolio: ${title}` : "Add New Portfolio"}
          </h2>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Project Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SIPINTAS - INFRASTRUKTUR"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Web Application">Web Application</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Web Admin Application">Web Admin Application</option>
                  <option value="Web Management Port">Web Management Port</option>
                  <option value="Web Admin Human Capital Application">Web Admin Human Capital Application</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. C#, React Native, Dotnet Web API"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Preview Link (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. https://play.google.com/..."
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">Image Path/URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. /images/portfolio/sipintas.svg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">Project Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Summarize what this application does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="col-12 text-end mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline-secondary me-2 px-3"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-warm px-4" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Portfolio"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Portfolios Table List */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Tech Stack</th>
                <th>Preview URL</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.length > 0 ? (
                portfolios.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={p.image_url || "/images/portfolio-placeholder.svg"}
                          alt={p.title}
                          className="rounded object-fit-cover border border-light-subtle"
                          style={{ width: "60px", height: "40px" }}
                        />
                        <div className="fw-semibold text-dark">{p.title}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                        {p.category}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {p.tech_stack.split(",").map((tech, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark font-monospace"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {p.preview_url && p.preview_url !== "#" ? (
                        <a
                          href={p.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none text-primary small d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-link-45deg"></i> Visit link
                        </a>
                      ) : (
                        <span className="text-muted small">No Link</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="btn btn-sm btn-outline-secondary me-2"
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No portfolio items found. Add one above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
