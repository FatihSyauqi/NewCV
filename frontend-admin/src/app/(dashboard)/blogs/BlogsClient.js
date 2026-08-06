"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/DataTable";

export default function BlogsClient({ initialBlogs }) {
  const [blogs, setBlogs] = useState(initialBlogs);
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
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Backend Development");
  const [status, setStatus] = useState("published");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");

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
    formData.append("type", "blogs");
    formData.append("name", slug || title);
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
    if (!confirm("Are you sure you want to delete this cover image from the server?")) return;
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
    setSlug("");
    setCategory("Backend Development");
    setStatus("published");
    setExcerpt("");
    setImageUrl("");
    setContent("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (b) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSlug(b.slug);
    setCategory(b.category);
    setStatus(b.status);
    setExcerpt(b.excerpt);
    setImageUrl(b.image_url);
    setContent(b.content);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      slug,
      category,
      status,
      excerpt,
      image_url: imageUrl || undefined,
      content
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`/AdminFSyauqi/api/blogs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch("/AdminFSyauqi/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save blog post");
      }

      const fetchRes = await fetch("/AdminFSyauqi/api/blogs");
      const list = await fetchRes.json();
      setBlogs(list);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog post? All associated files will be cleaned up.")) return;

    try {
      const response = await fetch(`/AdminFSyauqi/api/blogs/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog post");
      }

      setBlogs((prev) => prev.filter((b) => b.id !== id));
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
      render: (b) => (
        <div className="d-flex align-items-center gap-3">
          <img
            src={getImageUrl(b.image_url || "/images/blog-placeholder.svg")}
            alt={b.title}
            className="rounded object-fit-cover border border-light-subtle"
            style={{ width: "60px", height: "40px" }}
          />
          <div>
            <div className="fw-semibold text-dark">{b.title}</div>
            <div className="text-muted small">/{b.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (b) => (
        <span className="badge bg-info-subtle text-info border border-info-subtle">
          {b.category}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (b) => (
        <span className={`badge ${b.status === "published" ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}>
          {b.status === "published" ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      render: (b) => (
        <span className="text-muted small">
          {new Date(b.created_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (b) => (
        <div className="d-inline-flex gap-2">
          <button
            onClick={() => handleEditClick(b)}
            className="btn btn-sm btn-outline-secondary"
            title="Edit"
          >
            <i className="bi bi-pencil-square"></i>
          </button>
          <button
            onClick={() => handleDelete(b.id)}
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
          <h1 className="h3 fw-bold text-dark mb-1">Manage Blog Posts</h1>
          <p className="text-muted mb-0">Write and organize your developer blogs or technical documentation</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary-warm d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          <span>Add New Post</span>
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white rounded-3 shadow-lg border-0 w-100">
              <div className="modal-header border-bottom border-light p-3 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark">{editingId ? "Edit Blog Post" : "Add New Blog Post"}</h5>
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
                      <label className="form-label small fw-semibold text-muted">Post Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Building microservices with NestJS"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (!editingId) {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                          }
                        }}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">URL Slug (SEO friendly)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. building-microservices-nestjs"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
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
                        <option value="Backend Development">Backend Development</option>
                        <option value="Frontend Development">Frontend Development</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="DevOps & Cloud">DevOps & Cloud</option>
                        <option value="General Coding">General Coding</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-muted">Publish Status</label>
                      <select
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-muted">Cover Image</label>
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
                            placeholder="Or enter image URL path (e.g. /images/cover.png)"
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
                      <label className="form-label small fw-semibold text-muted">Post Excerpt</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="A short summary of the blog post (shows on list cards)..."
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Blog Content (Markdown supported)</label>
                      <textarea
                        className="form-control font-monospace"
                        rows="8"
                        placeholder="Write blog content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
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
                      "Save Post"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Blogs Table List */}
      <div className="admin-card p-0 overflow-hidden">
        <DataTable
          data={blogs}
          columns={columns}
          searchPlaceholder="Search blogs..."
          defaultSortKey="created_at"
          defaultSortDir="desc"
        />
      </div>
    </div>
  );
}
