"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/DataTable";

export default function PortfoliosClient({ initialPortfolios }) {
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    if (url.startsWith("/AdminFSyauqi")) return url;
    return url.startsWith("/") ? `/AdminFSyauqi${url}` : `/AdminFSyauqi/${url}`;
  };

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Website");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "portfolios");
    formData.append("name", title);
    formData.append("oldPath", imageUrl);

    try {
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImageUrl(data.logoUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    if (!confirm("Are you sure you want to delete this image from the server?")) return;
    try {
      setUploadingImage(true);
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: imageUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setImageUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Website");
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
        response = await fetch(`/AdminFSyauqi/api/portfolios/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Add Mode
        response = await fetch("/AdminFSyauqi/api/portfolios", {
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
      const fetchRes = await fetch("/AdminFSyauqi/api/portfolios");
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
    if (!confirm("Are you sure you want to delete this portfolio item? All associated files will be cleaned up.")) return;

    try {
      const response = await fetch(`/AdminFSyauqi/api/portfolios/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete portfolio");
      }

      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (p) => (
        <div className="d-flex align-items-center gap-3">
          <img
            src={getImageUrl(p.image_url || "/images/portfolio-placeholder.svg")}
            alt={p.title}
            className="rounded object-fit-cover border border-light-subtle"
            style={{ width: "60px", height: "40px" }}
          />
          <div className="fw-semibold text-dark">{p.title}</div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (p) => (
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
          {p.category}
        </span>
      ),
    },
    {
      key: "tech_stack",
      label: "Tech Stack",
      sortable: true,
      render: (p) => (
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
      ),
    },
    {
      key: "preview_url",
      label: "Preview URL",
      sortable: true,
      render: (p) =>
        p.preview_url && p.preview_url !== "#" ? (
          <a
            href={p.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-link btn-sm text-primary p-0 d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-link-45deg"></i> Visit link
          </a>
        ) : (
          <span className="text-muted small">No Link</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (p) => (
        <div className="d-inline-flex gap-2">
          <button
            onClick={() => handleEditClick(p)}
            className="btn btn-sm btn-outline-secondary"
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
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Manage Portfolios</h1>
          <p className="text-muted mb-0">Add, edit, or delete items in the portfolio grid section</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary-warm d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          <span>Add Portfolio</span>
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white rounded-3 shadow-lg border-0 w-100">
              <div className="modal-header border-bottom border-light p-3 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{editingId ? "Edit Portfolio" : "Add New Portfolio"}</h5>
                <button type="button" className="btn-close" onClick={resetForm}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {error && (
                    <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>{error}</div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Project Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. SIGMA 2.0"
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
                        required
                      >
                        <option value="Website">Website</option>
                        <option value="Mobile Application">Mobile Application</option>
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

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-muted">Project Image / Logo</label>
                      <div className="d-flex align-items-center gap-3">
                        {imageUrl ? (
                          <div className="border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                            <img src={getImageUrl(imageUrl)} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                          </div>
                        ) : (
                          <div className="border rounded bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: "80px", height: "80px" }}>
                            <i className="bi bi-image fs-2"></i>
                          </div>
                        )}
                        <div className="flex-grow-1">
                          <input
                            type="file"
                            className="form-control mb-2"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm text-muted"
                            placeholder="Or enter image URL path (e.g. /images/portfolio.png)"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                          />
                          {imageUrl && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger mt-2"
                              onClick={handleDeleteImage}
                              disabled={uploadingImage}
                            >
                              <i className="bi bi-trash me-1"></i> Delete Image
                            </button>
                          )}
                          {uploadingImage && (
                            <div className="mt-1 small text-primary">
                              <span className="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Project Description</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Describe the application features and your role..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-light p-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-warm px-4" disabled={loading || uploadingImage}>
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
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Portfolios Table List */}
      <div className="admin-card p-0 overflow-hidden">
        <DataTable
          data={portfolios}
          columns={columns}
          searchPlaceholder="Search portfolios..."
          defaultSortKey="title"
        />
      </div>
    </div>
  );
}
