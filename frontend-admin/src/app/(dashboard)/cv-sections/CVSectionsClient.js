"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CVSectionsClient({
  initialExperiences,
  initialEducation,
  initialCertificates
}) {
  const [activeTab, setActiveTab] = useState("experiences");
  const router = useRouter();

  // Lists
  const [exps, setExps] = useState(initialExperiences);
  const [edus, setEdus] = useState(initialEducation);
  const [certs, setCerts] = useState(initialCertificates);

  // General Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Control Form views
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);

  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEduId, setEditingEduId] = useState(null);

  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);

  // -------------------------------------------------------------
  // Experience Form Fields
  // -------------------------------------------------------------
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expSort, setExpSort] = useState(1);

  const handleEditExp = (e) => {
    setEditingExpId(e.id);
    setCompany(e.company);
    setRole(e.role);
    setExpLocation(e.location);
    setExpStart(e.start_date);
    setExpEnd(e.end_date);
    setExpDesc(e.description);
    setExpSort(e.sort_order);
    setShowExpForm(true);
  };

  const handleResetExp = () => {
    setEditingExpId(null);
    setCompany("");
    setRole("");
    setExpLocation("");
    setExpStart("");
    setExpEnd("");
    setExpDesc("");
    setExpSort(1);
    setShowExpForm(false);
  };

  const handleSubmitExp = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      company,
      role,
      location: expLocation,
      start_date: expStart,
      end_date: expEnd,
      description: expDesc,
      sort_order: parseInt(expSort, 10)
    };

    try {
      let res;
      if (editingExpId) {
        res = await fetch(`/api/experiences/${editingExpId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save experience");
      }

      const listRes = await fetch("/api/experiences");
      const list = await listRes.json();
      setExps(list);
      handleResetExp();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExp = async (id) => {
    if (!confirm("Delete this experience?")) return;
    try {
      const res = await fetch(`/api/experiences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setExps((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Education Form Fields
  // -------------------------------------------------------------
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");
  const [eduStart, setEduStart] = useState("");
  const [eduEnd, setEduEnd] = useState("");
  const [eduSort, setEduSort] = useState(1);

  const handleEditEdu = (e) => {
    setEditingEduId(e.id);
    setSchool(e.school);
    setDegree(e.degree);
    setMajor(e.major);
    setGpa(e.gpa);
    setEduStart(e.start_date);
    setEduEnd(e.end_date);
    setEduSort(e.sort_order);
    setShowEduForm(true);
  };

  const handleResetEdu = () => {
    setEditingEduId(null);
    setSchool("");
    setDegree("");
    setMajor("");
    setGpa("");
    setEduStart("");
    setEduEnd("");
    setEduSort(1);
    setShowEduForm(false);
  };

  const handleSubmitEdu = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      school,
      degree,
      major,
      gpa,
      start_date: eduStart,
      end_date: eduEnd,
      sort_order: parseInt(eduSort, 10)
    };

    try {
      let res;
      if (editingEduId) {
        res = await fetch(`/api/education/${editingEduId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save education");
      }

      const listRes = await fetch("/api/education");
      const list = await listRes.json();
      setEdus(list);
      handleResetEdu();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEdu = async (id) => {
    if (!confirm("Delete this education history?")) return;
    try {
      const res = await fetch(`/api/education/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEdus((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Certificates Form Fields
  // -------------------------------------------------------------
  const [certTitle, setCertTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [credId, setCredId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certSort, setCertSort] = useState(1);

  const handleEditCert = (c) => {
    setEditingCertId(c.id);
    setCertTitle(c.title);
    setIssuer(c.issuer);
    setCredId(c.credential_id);
    setIssueDate(c.issue_date);
    setCertSort(c.sort_order);
    setShowCertForm(true);
  };

  const handleResetCert = () => {
    setEditingCertId(null);
    setCertTitle("");
    setIssuer("");
    setCredId("");
    setIssueDate("");
    setCertSort(1);
    setShowCertForm(false);
  };

  const handleSubmitCert = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: certTitle,
      issuer,
      credential_id: credId,
      issue_date: issueDate,
      sort_order: parseInt(certSort, 10)
    };

    try {
      let res;
      if (editingCertId) {
        res = await fetch(`/api/certificates/${editingCertId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save certificate");
      }

      const listRes = await fetch("/api/certificates");
      const list = await listRes.json();
      setCerts(list);
      handleResetCert();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCert = async (id) => {
    if (!confirm("Delete this certificate?")) return;
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setCerts((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">CV Sections</h1>
        <p className="text-muted mb-0">Manage work history, academic background, and credentials</p>
      </div>

      {/* Tabs Menu */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            onClick={() => { setActiveTab("experiences"); setError(""); }}
            className={`nav-link fw-semibold px-4 ${activeTab === "experiences" ? "active text-dark" : "text-muted"}`}
          >
            <i className="bi bi-list-task me-1"></i> Experiences ({exps.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => { setActiveTab("education"); setError(""); }}
            className={`nav-link fw-semibold px-4 ${activeTab === "education" ? "active text-dark" : "text-muted"}`}
          >
            <i className="bi bi-mortarboard me-1"></i> Education ({edus.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => { setActiveTab("certificates"); setError(""); }}
            className={`nav-link fw-semibold px-4 ${activeTab === "certificates" ? "active text-dark" : "text-muted"}`}
          >
            <i className="bi bi-patch-check me-1"></i> Certificates ({certs.length})
          </button>
        </li>
      </ul>

      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* TAB CONTENT: EXPERIENCES */}
      {activeTab === "experiences" && (
        <div>
          {/* Header Action */}
          {!showExpForm && (
            <div className="text-end mb-4">
              <button onClick={() => setShowExpForm(true)} className="btn btn-primary-warm btn-sm">
                <i className="bi bi-plus-lg me-1"></i> Add Experience
              </button>
            </div>
          )}

          {/* Exp Form */}
          {showExpForm && (
            <div className="admin-card border-warning-subtle">
              <h3 className="h6 fw-bold mb-4">{editingExpId ? "Edit Experience" : "Add Experience"}</h3>
              <form onSubmit={handleSubmitExp}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Company Name</label>
                    <input type="text" className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Role/Title</label>
                    <input type="text" className="form-control" value={role} onChange={(e) => setRole(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Location</label>
                    <input type="text" className="form-control" placeholder="e.g. Bogor, Jawa Barat" value={expLocation} onChange={(e) => setExpLocation(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">Start Date</label>
                    <input type="text" className="form-control" placeholder="e.g. Feb 2019" value={expStart} onChange={(e) => setExpStart(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">End Date</label>
                    <input type="text" className="form-control" placeholder="e.g. July 2024 or Present" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} required />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small text-muted fw-semibold">Sort Order (lower numbers show first)</label>
                    <input type="number" className="form-control" style={{ maxWidth: "200px" }} value={expSort} onChange={(e) => setExpSort(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-muted fw-semibold">Responsibilities / Description</label>
                    <textarea className="form-control" rows="4" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required></textarea>
                  </div>
                  <div className="col-12 text-end">
                    <button type="button" onClick={handleResetExp} className="btn btn-sm btn-outline-secondary me-2">Cancel</button>
                    <button type="submit" className="btn btn-sm btn-primary-warm px-4" disabled={loading}>Save</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Exp List */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company & Location</th>
                    <th>Duration</th>
                    <th className="text-center">Order</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exps.length > 0 ? (
                    exps.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="fw-semibold text-dark">{e.role}</div>
                        </td>
                        <td>
                          <div>{e.company}</div>
                          <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{e.location}</small>
                        </td>
                        <td><small className="text-muted-emphasis">{e.start_date} - {e.end_date}</small></td>
                        <td className="text-center"><span className="badge bg-light text-dark">{e.sort_order}</span></td>
                        <td className="text-end">
                          <button onClick={() => handleEditExp(e)} className="btn btn-sm btn-outline-secondary me-2"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteExp(e.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No experiences added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EDUCATION */}
      {activeTab === "education" && (
        <div>
          {/* Header Action */}
          {!showEduForm && (
            <div className="text-end mb-4">
              <button onClick={() => setShowEduForm(true)} className="btn btn-primary-warm btn-sm">
                <i className="bi bi-plus-lg me-1"></i> Add Education
              </button>
            </div>
          )}

          {/* Edu Form */}
          {showEduForm && (
            <div className="admin-card border-warning-subtle">
              <h3 className="h6 fw-bold mb-4">{editingEduId ? "Edit Education" : "Add Education"}</h3>
              <form onSubmit={handleSubmitEdu}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">School/University</label>
                    <input type="text" className="form-control" value={school} onChange={(e) => setSchool(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Degree</label>
                    <input type="text" className="form-control" placeholder="e.g. Bachelor's Degree" value={degree} onChange={(e) => setDegree(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Major</label>
                    <input type="text" className="form-control" placeholder="e.g. Informatics Engineering" value={major} onChange={(e) => setMajor(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">GPA</label>
                    <input type="text" className="form-control" placeholder="e.g. 3.53 from 4.00" value={gpa} onChange={(e) => setGpa(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">Start Date</label>
                    <input type="text" className="form-control" placeholder="e.g. Sept 2015" value={eduStart} onChange={(e) => setEduStart(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">End Date</label>
                    <input type="text" className="form-control" placeholder="e.g. Jan 2020" value={eduEnd} onChange={(e) => setEduEnd(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Sort Order</label>
                    <input type="number" className="form-control" style={{ maxWidth: "200px" }} value={eduSort} onChange={(e) => setEduSort(e.target.value)} required />
                  </div>
                  <div className="col-12 text-end">
                    <button type="button" onClick={handleResetEdu} className="btn btn-sm btn-outline-secondary me-2">Cancel</button>
                    <button type="submit" className="btn btn-sm btn-primary-warm px-4" disabled={loading}>Save</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Edu List */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead>
                  <tr>
                    <th>Degree & Major</th>
                    <th>School</th>
                    <th>GPA</th>
                    <th>Duration</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {edus.length > 0 ? (
                    edus.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="fw-semibold text-dark">{e.degree}</div>
                          <small className="text-muted">{e.major}</small>
                        </td>
                        <td>{e.school}</td>
                        <td><span className="badge bg-warning-subtle text-warning border border-warning-subtle">{e.gpa}</span></td>
                        <td><small className="text-muted-emphasis">{e.start_date} - {e.end_date}</small></td>
                        <td className="text-end">
                          <button onClick={() => handleEditEdu(e)} className="btn btn-sm btn-outline-secondary me-2"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteEdu(e.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No education history added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CERTIFICATES */}
      {activeTab === "certificates" && (
        <div>
          {/* Header Action */}
          {!showCertForm && (
            <div className="text-end mb-4">
              <button onClick={() => setShowCertForm(true)} className="btn btn-primary-warm btn-sm">
                <i className="bi bi-plus-lg me-1"></i> Add Certificate
              </button>
            </div>
          )}

          {/* Cert Form */}
          {showCertForm && (
            <div className="admin-card border-warning-subtle">
              <h3 className="h6 fw-bold mb-4">{editingCertId ? "Edit Certificate" : "Add Certificate"}</h3>
              <form onSubmit={handleSubmitCert}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Certificate Title</label>
                    <input type="text" className="form-control" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Issuer</label>
                    <input type="text" className="form-control" placeholder="e.g. Semrush.com or BNSP" value={issuer} onChange={(e) => setIssuer(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-semibold">Credential ID</label>
                    <input type="text" className="form-control" value={credId} onChange={(e) => setCredId(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">Issue Date/Year</label>
                    <input type="text" className="form-control" placeholder="e.g. 2024" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted fw-semibold">Sort Order</label>
                    <input type="number" className="form-control" value={certSort} onChange={(e) => setCertSort(e.target.value)} required />
                  </div>
                  <div className="col-12 text-end">
                    <button type="button" onClick={handleResetCert} className="btn btn-sm btn-outline-secondary me-2">Cancel</button>
                    <button type="submit" className="btn btn-sm btn-primary-warm px-4" disabled={loading}>Save</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Cert List */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead>
                  <tr>
                    <th>Certificate Title</th>
                    <th>Issuer</th>
                    <th>Credential ID</th>
                    <th>Issue Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.length > 0 ? (
                    certs.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-semibold text-dark">{c.title}</div>
                        </td>
                        <td>{c.issuer}</td>
                        <td><small className="text-muted font-monospace">{c.credential_id || "-"}</small></td>
                        <td><small className="text-muted-emphasis">{c.issue_date}</small></td>
                        <td className="text-end">
                          <button onClick={() => handleEditCert(c)} className="btn btn-sm btn-outline-secondary me-2"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteCert(c.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No certificates added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
