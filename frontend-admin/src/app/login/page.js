"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/admin/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Success, redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <div className="d-inline-flex justify-content-center align-items-center bg-warning-subtle text-warning rounded-circle p-3 mb-3" style={{ width: "60px", height: "60px" }}>
            <i className="bi bi-shield-lock-fill fs-3"></i>
          </div>
          <h2 className="fw-bold text-dark h3">CV Content Manager</h2>
          <p className="text-muted small">Sign in to manage Fatih Syauqi's website</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-light-subtle text-muted">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-lg bg-light border-light-subtle fs-6"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-light-subtle text-muted">
                <i className="bi bi-key"></i>
              </span>
              <input
                type="password"
                className="form-control form-control-lg bg-light border-light-subtle fs-6"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-lg btn-primary-warm w-100 py-2.5 fs-6"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <small className="text-muted-emphasis font-monospace" style={{ fontSize: "0.75rem" }}>
            Secured Session | v1.0.0
          </small>
        </div>
      </div>
    </div>
  );
}
