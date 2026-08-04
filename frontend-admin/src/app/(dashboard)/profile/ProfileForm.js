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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      setMessage("Profile info updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div className="alert alert-success d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
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
          <label className="form-label small fw-semibold text-muted">Professional Title</label>
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
          <label className="form-label small fw-semibold text-muted">LinkedIn URL</label>
          <input
            type="url"
            className="form-control"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">GitHub URL</label>
          <input
            type="url"
            className="form-control"
            name="github"
            value={formData.github}
            onChange={handleChange}
          />
        </div>

        <div className="col-12">
          <label className="form-label small fw-semibold text-muted">Avatar Image Path (e.g. /images/avatar.jpg)</label>
          <input
            type="text"
            className="form-control"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            required
          />
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
