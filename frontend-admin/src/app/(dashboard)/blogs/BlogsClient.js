"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlogsClient({ initialBlogs }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();

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
        response = await fetch(`/admin/api/blogs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch("/admin/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save blog post");
      }

      // Reload list
      const fetchRes = await fetch("/admin/api/blogs");
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
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const response = await fetch(`/admin/api/blogs/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete blog post");
      }

      setBlogs((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Manage Blogs</h1>
          <p className="text-muted mb-0">Write articles or share tech learnings</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary-warm">
            <i className="bi bi-plus-lg me-1"></i> Write Article
          </button>
        )}
      </div>

      {/* Write/Edit Form */}
      {showForm && (
        <div className="admin-card">
          <h2 className="h5 fw-bold mb-4 text-dark">
            {editingId ? `Edit Article: ${title}` : "Write New Article"}
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
                <label className="form-label small fw-semibold text-muted">Article Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Membangun Arsitektur Microservices"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Custom Slug (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. membangun-microservices (leave blank to auto-generate)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Backend Development">Backend Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="General Tech">General Tech</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-muted">Publish Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">Cover Image Path/URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. /images/blog/dotnet-microservices.svg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">Excerpt (Short Summary)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="A brief 1-sentence teaser..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">Full Content</label>
                <textarea
                  className="form-control"
                  rows="10"
                  placeholder="Write your article body here. Supports standard text formatting..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                      Publishing...
                    </>
                  ) : (
                    "Save Article"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Blogs Table List */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length > 0 ? (
                blogs.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={b.image_url || "/images/blog-placeholder.svg"}
                          alt={b.title}
                          className="rounded object-fit-cover border border-light-subtle"
                          style={{ width: "60px", height: "40px" }}
                        />
                        <div>
                          <div className="fw-semibold text-dark">{b.title}</div>
                          <small className="text-muted font-monospace">{b.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-body-secondary text-dark-emphasis border border-light-subtle px-2 py-1">
                        {b.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.status === "published" ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-muted border border-secondary-subtle"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(b.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </small>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleEditClick(b)}
                        className="btn btn-sm btn-outline-secondary me-2"
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No articles written yet. Write one above!
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
