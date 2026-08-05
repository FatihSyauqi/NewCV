"use client";

import { useState } from "react";

export default function ProfileForm({ initialProfile }) {
  const [formData, setFormData] = useState({
    name: initialProfile?.name || "",
    title: initialProfile?.title || "",
    email: initialProfile?.email || "",
    location: initialProfile?.location || "",
    linkedin: initialProfile?.linkedin || "",
    github: initialProfile?.github || "",
    about_me: initialProfile?.about_me || "",
    avatar_url: initialProfile?.avatar_url || "/images/avatar.jpg"
  });

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    if (url.startsWith("/admin")) return url;
    return url.startsWith("/") ? `/admin${url}` : `/admin/${url}`;
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");

    const dataObj = new FormData();
    dataObj.append("file", file);
    dataObj.append("type", "profile");
    dataObj.append("name", "avatar");
    
    // Clean up old avatar if it's not the default placeholder
    if (formData.avatar_url && formData.avatar_url !== "/images/avatar.jpg") {
      dataObj.append("oldPath", formData.avatar_url);
    }

    try {
      const res = await fetch("/admin/api/upload", {
        method: "POST",
        body: dataObj,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFormData((prev) => ({ ...prev, avatar_url: data.logoUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!formData.avatar_url || formData.avatar_url === "/images/avatar.jpg") return;
    if (!confirm("Are you sure you want to delete this custom avatar from the server?")) return;
    try {
      setUploadingAvatar(true);
      const res = await fetch("/admin/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: formData.avatar_url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setFormData((prev) => ({ ...prev, avatar_url: "/images/avatar.jpg" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/admin/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card p-4">
      <h2 className="h4 fw-bold text-dark mb-4 border-bottom border-light pb-2">Profile Information</h2>

      {message && (
        <div className="alert alert-success py-2 small d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">Full Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">Job Title / Headline</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">Email Address</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">Location</label>
          <input
            type="text"
            className="form-control"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">LinkedIn Profile URL</label>
          <input
            type="text"
            className="form-control"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">GitHub Profile URL</label>
          <input
            type="text"
            className="form-control"
            name="github"
            value={formData.github}
            onChange={handleChange}
          />
        </div>

        <div className="col-12">
          <label className="form-label small fw-semibold text-muted">Avatar Image</label>
          <div className="d-flex align-items-center gap-3">
            {formData.avatar_url ? (
              <div className="border rounded p-1 bg-light d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                <img src={getImageUrl(formData.avatar_url)} alt="Avatar Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover", borderRadius: "50%" }} />
              </div>
            ) : (
              <div className="border rounded bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: "80px", height: "80px" }}>
                <i className="bi bi-person fs-2"></i>
              </div>
            )}
            <div className="flex-grow-1">
              <input
                type="file"
                className="form-control mb-2"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <input
                type="text"
                className="form-control form-control-sm text-muted"
                name="avatar_url"
                placeholder="Or enter avatar URL path (e.g. /images/avatar.jpg)"
                value={formData.avatar_url}
                onChange={handleChange}
                required
              />
              {formData.avatar_url && formData.avatar_url !== "/images/avatar.jpg" && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={handleDeleteAvatar}
                  disabled={uploadingAvatar}
                >
                  <i className="bi bi-trash me-1"></i> Delete Avatar Image
                </button>
              )}
              {uploadingAvatar && (
                <div className="mt-1 small text-primary">
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label small fw-semibold text-muted">About Me (Bio)</label>
          <textarea
            className="form-control"
            name="about_me"
            rows="6"
            value={formData.about_me}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="col-12 mt-4 text-end">
          <button type="submit" className="btn btn-primary-warm px-4 py-2" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-1"></i> Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
