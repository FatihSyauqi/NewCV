"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/DataTable";

export default function CVSectionsClient({
  initialExperiences,
  initialEducation,
  initialCertificates,
  initialSkills
}) {
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    if (url.startsWith("/AdminFSyauqi")) return url;
    return url.startsWith("/") ? `/AdminFSyauqi${url}` : `/AdminFSyauqi/${url}`;
  };

  const [activeTab, setActiveTab] = useState("experiences");
  const router = useRouter();

  // Lists
  const [exps, setExps] = useState(initialExperiences);
  const [edus, setEdus] = useState(initialEducation);
  const [certs, setCerts] = useState(initialCertificates);
  const [skills, setSkills] = useState(initialSkills || []);

  // General Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Control Form views (now modal overlays)
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);

  // Experience Form Fields
  const [editingExpId, setEditingExpId] = useState(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expSort, setExpSort] = useState(0);
  const [expLogoUrl, setExpLogoUrl] = useState("");
  const [uploadingExpLogo, setUploadingExpLogo] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);

  // Education Form Fields
  const [editingEduId, setEditingEduId] = useState(null);
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");
  const [eduStart, setEduStart] = useState("");
  const [eduEnd, setEduEnd] = useState("");
  const [eduSort, setEduSort] = useState(0);
  const [eduLogoUrl, setEduLogoUrl] = useState("");
  const [uploadingEduLogo, setUploadingEduLogo] = useState(false);

  // Certificate Form Fields
  const [editingCertId, setEditingCertId] = useState(null);
  const [certTitle, setCertTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [credId, setCredId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certSort, setCertSort] = useState(0);

  // Skill Form Fields
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("Programming Languages");
  const [skillLogoUrl, setSkillLogoUrl] = useState("");
  const [skillSort, setSkillSort] = useState(0);
  const [skillIsHighlight, setSkillIsHighlight] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Reset helpers
  const handleResetExp = () => {
    setEditingExpId(null);
    setCompany("");
    setRole("");
    setExpLocation("");
    setExpStart("");
    setExpEnd("");
    setExpDesc("");
    setExpSort(0);
    setExpLogoUrl("");
    setSelectedSkillIds([]);
    setShowExpForm(false);
  };

  const handleResetEdu = () => {
    setEditingEduId(null);
    setSchool("");
    setDegree("");
    setMajor("");
    setGpa("");
    setEduStart("");
    setEduEnd("");
    setEduSort(0);
    setEduLogoUrl("");
    setShowEduForm(false);
  };

  const handleResetCert = () => {
    setEditingCertId(null);
    setCertTitle("");
    setIssuer("");
    setCredId("");
    setIssueDate("");
    setCertSort(0);
    setShowCertForm(false);
  };

  const handleResetSkill = () => {
    setEditingSkillId(null);
    setSkillName("");
    setSkillCategory("Programming Languages");
    setSkillLogoUrl("");
    setSkillSort(0);
    setSkillIsHighlight(false);
    setShowSkillForm(false);
  };

  // Submit Handlers
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
      sort_order: parseInt(expSort, 10) || 0,
      logo_url: expLogoUrl || null,
      skill_ids: selectedSkillIds.join(",")
    };

    try {
      let res;
      if (editingExpId) {
        res = await fetch(`/AdminFSyauqi/api/experiences/${editingExpId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/AdminFSyauqi/api/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save experience");
      }

      const listRes = await fetch("/AdminFSyauqi/api/experiences");
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
      const res = await fetch(`/AdminFSyauqi/api/experiences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setExps((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
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
      sort_order: parseInt(eduSort, 10) || 0,
      logo_url: eduLogoUrl || null
    };

    try {
      let res;
      if (editingEduId) {
        res = await fetch(`/AdminFSyauqi/api/education/${editingEduId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/AdminFSyauqi/api/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save education");
      }

      const listRes = await fetch("/AdminFSyauqi/api/education");
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
    if (!confirm("Delete this education record?")) return;
    try {
      const res = await fetch(`/AdminFSyauqi/api/education/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEdus((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitCert = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: certTitle,
      issuer,
      credential_id: credId || null,
      issue_date: issueDate,
      sort_order: parseInt(certSort, 10) || 0
    };

    try {
      let res;
      if (editingCertId) {
        res = await fetch(`/AdminFSyauqi/api/certificates/${editingCertId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/AdminFSyauqi/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save certificate");
      }

      const listRes = await fetch("/AdminFSyauqi/api/certificates");
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
      const res = await fetch(`/AdminFSyauqi/api/certificates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setCerts((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "skills");
    formData.append("name", skillName);
    formData.append("oldPath", skillLogoUrl);

    try {
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSkillLogoUrl(data.logoUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!skillLogoUrl) return;
    if (!confirm("Are you sure you want to delete this logo from the server?")) return;
    try {
      setUploadingLogo(true);
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: skillLogoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setSkillLogoUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleExpLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingExpLogo(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "experiences");
    formData.append("name", company || "experience-company");
    formData.append("oldPath", expLogoUrl);

    try {
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setExpLogoUrl(data.logoUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingExpLogo(false);
    }
  };

  const handleDeleteExpLogo = async () => {
    if (!expLogoUrl) return;
    if (!confirm("Are you sure you want to delete this company logo from the server?")) return;
    try {
      setUploadingExpLogo(true);
      const res = await fetch("/AdminFSyauqi/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: expLogoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setExpLogoUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingExpLogo(false);
    }
  };

  const handleSubmitSkill = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: skillName,
      category: skillCategory,
      logo_url: skillLogoUrl || null,
      sort_order: parseInt(skillSort, 10) || 0,
      is_highlight: skillIsHighlight ? 1 : 0
    };

    try {
      let res;
      if (editingSkillId) {
        res = await fetch(`/AdminFSyauqi/api/skills/${editingSkillId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/AdminFSyauqi/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save skill");
      }

      const listRes = await fetch("/AdminFSyauqi/api/skills");
      const list = await listRes.json();
      setSkills(list);
      handleResetSkill();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!confirm("Delete this skill? All associated files will be cleaned up.")) return;
    try {
      const res = await fetch(`/AdminFSyauqi/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSkills((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit Click Handlers
  const handleEditExp = (e) => {
    setEditingExpId(e.id);
    setCompany(e.company);
    setRole(e.role);
    setExpLocation(e.location);
    setExpStart(e.start_date);
    setExpEnd(e.end_date);
    setExpDesc(e.description);
    setExpSort(e.sort_order || 0);
    setExpLogoUrl(e.logo_url || "");
    const ids = e.skill_ids ? e.skill_ids.split(",").map(Number).filter(Boolean) : [];
    setSelectedSkillIds(ids);
    setShowExpForm(true);
  };

  const handleEditEdu = (e) => {
    setEditingEduId(e.id);
    setSchool(e.school);
    setDegree(e.degree);
    setMajor(e.major);
    setGpa(e.gpa);
    setEduStart(e.start_date);
    setEduEnd(e.end_date);
    setEduSort(e.sort_order || 0);
    setEduLogoUrl(e.logo_url || "");
    setShowEduForm(true);
  };

  const handleEditCert = (c) => {
    setEditingCertId(c.id);
    setCertTitle(c.title);
    setIssuer(c.issuer);
    setCredId(c.credential_id || "");
    setIssueDate(c.issue_date);
    setCertSort(c.sort_order || 0);
    setShowCertForm(true);
  };

  const handleEditSkill = (s) => {
    setEditingSkillId(s.id);
    setSkillName(s.name);
    setSkillCategory(s.category);
    setSkillLogoUrl(s.logo_url || "");
    setSkillSort(s.sort_order || 0);
    setSkillIsHighlight(!!s.is_highlight);
    setShowSkillForm(true);
  };

  // DataTable Column Definitions
  const expColumns = [
    {
      key: "logo_url",
      label: "Logo",
      sortable: false,
      style: { width: "80px" },
      render: (e) => (
        e.logo_url ? (
          <div className="d-flex align-items-center justify-content-center border rounded p-1 bg-light" style={{ width: "50px", height: "50px" }}>
            <img src={getImageUrl(e.logo_url)} alt={e.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div className="bg-light-subtle text-muted rounded border d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px" }}>
            <i className="bi bi-building"></i>
          </div>
        )
      )
    },
    { key: "role", label: "Role", sortable: true, render: (e) => <div className="fw-semibold text-dark">{e.role}</div> },
    {
      key: "company",
      label: "Company & Location",
      sortable: true,
      render: (e) => (
        <div>
          <div>{e.company}</div>
          <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{e.location}</small>
        </div>
      )
    },
    { key: "start_date", label: "Duration", sortable: true, render: (e) => <small className="text-muted-emphasis">{e.start_date} - {e.end_date}</small> },
    { key: "sort_order", label: "Order", sortable: true, className: "text-center", render: (e) => <span className="badge bg-light text-dark">{e.sort_order}</span> },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (e) => (
        <div className="d-inline-flex gap-2">
          <button onClick={() => handleEditExp(e)} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil-square"></i></button>
          <button onClick={() => handleDeleteExp(e.id)} className="btn btn-sm btn-outline-danger" title="Delete"><i className="bi bi-trash"></i></button>
        </div>
      )
    }
  ];

  const eduColumns = [
    {
      key: "logo_url",
      label: "Logo",
      sortable: false,
      style: { width: "70px" },
      render: (e) => (
        e.logo_url ? (
          <div className="d-flex align-items-center justify-content-center border rounded p-1 bg-light" style={{ width: "48px", height: "48px" }}>
            <img src={getImageUrl(e.logo_url)} alt={e.school} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div className="bg-light-subtle text-muted rounded border d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
            <i className="bi bi-mortarboard"></i>
          </div>
        )
      )
    },
    {
      key: "degree",
      label: "Degree & Major",
      sortable: true,
      render: (e) => (
        <div>
          <div className="fw-semibold text-dark">{e.degree}</div>
          <small className="text-muted">{e.major}</small>
        </div>
      )
    },
    { key: "school", label: "School", sortable: true },
    { key: "gpa", label: "GPA", sortable: true, render: (e) => <span className="badge bg-warning-subtle text-warning border border-warning-subtle">{e.gpa}</span> },
    { key: "start_date", label: "Duration", sortable: true, render: (e) => <small className="text-muted-emphasis">{e.start_date} - {e.end_date}</small> },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (e) => (
        <div className="d-inline-flex gap-2">
          <button onClick={() => handleEditEdu(e)} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil-square"></i></button>
          <button onClick={() => handleDeleteEdu(e.id)} className="btn btn-sm btn-outline-danger" title="Delete"><i className="bi bi-trash"></i></button>
        </div>
      )
    }
  ];

  const certColumns = [
    { key: "title", label: "Certificate Title", sortable: true, render: (c) => <div className="fw-semibold text-dark">{c.title}</div> },
    { key: "issuer", label: "Issuer", sortable: true },
    { key: "credential_id", label: "Credential ID", sortable: true, render: (c) => <small className="text-muted font-monospace">{c.credential_id || "-"}</small> },
    { key: "issue_date", label: "Issue Date", sortable: true, render: (c) => <small className="text-muted-emphasis">{c.issue_date}</small> },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (c) => (
        <div className="d-inline-flex gap-2">
          <button onClick={() => handleEditCert(c)} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil-square"></i></button>
          <button onClick={() => handleDeleteCert(c.id)} className="btn btn-sm btn-outline-danger" title="Delete"><i className="bi bi-trash"></i></button>
        </div>
      )
    }
  ];

  const skillColumns = [
    {
      key: "logo_url",
      label: "Logo",
      sortable: false,
      style: { width: "80px" },
      render: (s) => (
        s.logo_url ? (
          <div className="d-flex align-items-center justify-content-center border rounded p-1 bg-light" style={{ width: "40px", height: "40px" }}>
            <img src={getImageUrl(s.logo_url)} alt={s.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
            <i className="bi bi-code-slash"></i>
          </div>
        )
      )
    },
    { key: "name", label: "Skill Name", sortable: true, render: (s) => <div className="fw-semibold text-dark">{s.name}</div> },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (s) => (
        <span className="badge bg-secondary-subtle text-secondary border px-2.5 py-1 text-uppercase font-monospace" style={{ fontSize: "0.75rem" }}>
          {s.category}
        </span>
      )
    },
    { key: "sort_order", label: "Order", sortable: true, className: "text-center", style: { width: "100px" }, render: (s) => <span className="font-monospace text-muted">{s.sort_order || 0}</span> },
    {
      key: "is_highlight",
      label: "Highlight",
      sortable: true,
      className: "text-center",
      style: { width: "120px" },
      render: (s) => (
        s.is_highlight ? (
          <span className="badge bg-success-subtle text-success border px-2 py-1"><i className="bi bi-check-lg"></i> Yes</span>
        ) : (
          <span className="badge bg-light text-muted border px-2 py-1">No</span>
        )
      )
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      style: { width: "120px" },
      render: (s) => (
        <div className="d-inline-flex gap-2">
          <button onClick={() => handleEditSkill(s)} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil-square"></i></button>
          <button onClick={() => handleDeleteSkill(s.id)} className="btn btn-sm btn-outline-danger" title="Delete"><i className="bi bi-trash"></i></button>
        </div>
      )
    }
  ];

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
        <li className="nav-item">
          <button
            onClick={() => { setActiveTab("skills"); setError(""); }}
            className={`nav-link fw-semibold px-4 ${activeTab === "skills" ? "active text-dark" : "text-muted"}`}
          >
            <i className="bi bi-cpu me-1"></i> Skills & Tech Stack ({skills.length})
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
          <div className="text-end mb-4">
            <button 
              onClick={() => {
                const max = exps.length > 0 ? Math.max(...exps.map(x => x.sort_order || 0)) : 0;
                setExpSort(max + 1);
                setShowExpForm(true);
              }} 
              className="btn btn-primary-warm btn-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Experience
            </button>
          </div>

          {/* Exp Form Modal */}
          {showExpForm && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold text-dark">{editingExpId ? "Edit Experience" : "Add Experience"}</h5>
                    <button type="button" className="btn-close" onClick={handleResetExp} aria-label="Close"></button>
                  </div>
                  <form onSubmit={handleSubmitExp}>
                    <div className="modal-body">
                      <div className="row g-3 text-start">
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
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-muted">Company Logo</label>
                          <div className="d-flex align-items-center gap-3">
                            {expLogoUrl ? (
                              <div className="border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                                <img src={getImageUrl(expLogoUrl)} alt="Company Logo Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div className="border rounded bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: "80px", height: "80px" }}>
                                <i className="bi bi-building fs-2"></i>
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <input
                                type="file"
                                className="form-control mb-2"
                                accept="image/*"
                                onChange={handleExpLogoUpload}
                                disabled={uploadingExpLogo}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm text-muted"
                                placeholder="Or enter logo URL path (e.g. /uploads/experiences/logo.png)"
                                value={expLogoUrl}
                                onChange={(e) => setExpLogoUrl(e.target.value)}
                              />
                              {expLogoUrl && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger mt-2"
                                  onClick={handleDeleteExpLogo}
                                  disabled={uploadingExpLogo}
                                >
                                  <i className="bi bi-trash me-1"></i> Delete Logo
                                </button>
                              )}
                              {uploadingExpLogo && (
                                <div className="mt-1 small text-primary">
                                  <span className="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label small text-muted fw-semibold">Responsibilities / Description</label>
                          <textarea className="form-control" rows="4" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required></textarea>
                        </div>
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-muted">Skills / Technologies (Select multiple)</label>
                          <div className="d-flex flex-wrap gap-2 border rounded p-3 bg-light" style={{ maxHeight: "200px", overflowY: "auto" }}>
                            {skills.map((s) => {
                              const isChecked = selectedSkillIds.includes(s.id);
                              return (
                                <div key={s.id} className="form-check me-3 mb-2" style={{ minWidth: "180px" }}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`exp-skill-${s.id}`}
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedSkillIds((prev) =>
                                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                                      );
                                    }}
                                  />
                                  <label className="form-check-label small text-dark d-flex align-items-center gap-2 mb-0" htmlFor={`exp-skill-${s.id}`} style={{ cursor: "pointer" }}>
                                    {s.logo_url && (
                                      <img src={getImageUrl(s.logo_url)} alt="" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                                    )}
                                    {s.name}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={handleResetExp} className="btn btn-outline-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary-warm px-4" disabled={loading}>Save</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Exp DataTable List */}
          <div className="admin-card p-0 overflow-hidden">
            <DataTable
              data={exps}
              columns={expColumns}
              searchPlaceholder="Search experiences..."
              defaultSortKey="sort_order"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: EDUCATION */}
      {activeTab === "education" && (
        <div>
          {/* Header Action */}
          <div className="text-end mb-4">
            <button 
              onClick={() => {
                const max = edus.length > 0 ? Math.max(...edus.map(x => x.sort_order || 0)) : 0;
                setEduSort(max + 1);
                setShowEduForm(true);
              }} 
              className="btn btn-primary-warm btn-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Education
            </button>
          </div>

          {/* Edu Form Modal */}
          {showEduForm && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold text-dark">{editingEduId ? "Edit Education" : "Add Education"}</h5>
                    <button type="button" className="btn-close" onClick={handleResetEdu} aria-label="Close"></button>
                  </div>
                  <form onSubmit={handleSubmitEdu}>
                    <div className="modal-body">
                      <div className="row g-3 text-start">
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
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-muted">School Logo</label>
                          <div className="d-flex align-items-center gap-3">
                            {eduLogoUrl ? (
                              <div className="border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: "72px", height: "72px" }}>
                                <img src={getImageUrl(eduLogoUrl)} alt="School Logo Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div className="border rounded bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: "72px", height: "72px" }}>
                                <i className="bi bi-mortarboard fs-2"></i>
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <input
                                type="file"
                                className="form-control mb-2"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  setUploadingEduLogo(true);
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  formData.append("type", "education");
                                  formData.append("name", school || "school-logo");
                                  formData.append("oldPath", eduLogoUrl);
                                  try {
                                    const res = await fetch("/admin/api/upload", { method: "POST", body: formData });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || "Upload failed");
                                    setEduLogoUrl(data.logoUrl);
                                  } catch (err) { setError(err.message); }
                                  finally { setUploadingEduLogo(false); }
                                }}
                                disabled={uploadingEduLogo}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm text-muted"
                                placeholder="Or enter logo URL (e.g. /uploads/education/logo.png)"
                                value={eduLogoUrl}
                                onChange={(e) => setEduLogoUrl(e.target.value)}
                              />
                              {eduLogoUrl && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger mt-2"
                                  onClick={async () => {
                                    if (!confirm("Delete this school logo?")) return;
                                    setUploadingEduLogo(true);
                                    try {
                                      const res = await fetch("/admin/api/upload", {
                                        method: "DELETE",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ filePath: eduLogoUrl }),
                                      });
                                      if (!res.ok) throw new Error("Delete failed");
                                      setEduLogoUrl("");
                                    } catch (err) { setError(err.message); }
                                    finally { setUploadingEduLogo(false); }
                                  }}
                                  disabled={uploadingEduLogo}
                                >
                                  <i className="bi bi-trash me-1"></i> Delete Logo
                                </button>
                              )}
                              {uploadingEduLogo && (
                                <div className="mt-1 small text-primary">
                                  <span className="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={handleResetEdu} className="btn btn-outline-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary-warm px-4" disabled={loading}>Save</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edu DataTable List */}
          <div className="admin-card p-0 overflow-hidden">
            <DataTable
              data={edus}
              columns={eduColumns}
              searchPlaceholder="Search education..."
              defaultSortKey="school"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: CERTIFICATES */}
      {activeTab === "certificates" && (
        <div>
          {/* Header Action */}
          <div className="text-end mb-4">
            <button 
              onClick={() => {
                const max = certs.length > 0 ? Math.max(...certs.map(x => x.sort_order || 0)) : 0;
                setCertSort(max + 1);
                setShowCertForm(true);
              }} 
              className="btn btn-primary-warm btn-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Certificate
            </button>
          </div>

          {/* Cert Form Modal */}
          {showCertForm && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold text-dark">{editingCertId ? "Edit Certificate" : "Add Certificate"}</h5>
                    <button type="button" className="btn-close" onClick={handleResetCert} aria-label="Close"></button>
                  </div>
                  <form onSubmit={handleSubmitCert}>
                    <div className="modal-body">
                      <div className="row g-3 text-start">
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
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={handleResetCert} className="btn btn-outline-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary-warm px-4" disabled={loading}>Save</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Cert DataTable List */}
          <div className="admin-card p-0 overflow-hidden">
            <DataTable
              data={certs}
              columns={certColumns}
              searchPlaceholder="Search certificates..."
              defaultSortKey="title"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: SKILLS */}
      {activeTab === "skills" && (
        <div>
          {/* Header Action */}
          <div className="text-end mb-4">
            <button 
              onClick={() => {
                const max = skills.length > 0 ? Math.max(...skills.map(x => x.sort_order || 0)) : 0;
                setSkillSort(max + 1);
                setShowSkillForm(true);
              }} 
              className="btn btn-primary-warm btn-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Skill
            </button>
          </div>

          {/* Skill Form Modal */}
          {showSkillForm && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold text-dark">{editingSkillId ? `Edit Skill: ${skillName}` : "Add New Skill"}</h5>
                    <button type="button" className="btn-close" onClick={handleResetSkill} aria-label="Close"></button>
                  </div>
                  <form onSubmit={handleSubmitSkill}>
                    <div className="modal-body">
                      <div className="row g-3 text-start">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-muted">Skill Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            placeholder="e.g. ReactJS, Docker, C#"
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-muted">Category</label>
                          <select
                            className="form-select"
                            value={skillCategory}
                            onChange={(e) => setSkillCategory(e.target.value)}
                            required
                          >
                            <option value="Programming Languages">Programming Languages</option>
                            <option value="Programming Tools">Programming Tools</option>
                            <option value="Design Tools">Design Tools</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-muted">Sort Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={skillSort}
                            onChange={(e) => setSkillSort(e.target.value)}
                            required
                          />
                        </div>

                        <div className="col-md-6 d-flex align-items-center mt-md-5">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="isHighlightSwitch"
                              checked={skillIsHighlight}
                              onChange={(e) => setSkillIsHighlight(e.target.checked)}
                            />
                            <label className="form-check-label small fw-semibold text-muted" htmlFor="isHighlightSwitch">
                              Highlight under Profile Photo
                            </label>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-muted">Skill Logo</label>
                          <div className="d-flex align-items-center gap-3">
                            {skillLogoUrl ? (
                              <div className="border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: "64px", height: "64px" }}>
                                <img src={getImageUrl(skillLogoUrl)} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div className="border rounded bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: "64px", height: "64px" }}>
                                <i className="bi bi-image fs-3"></i>
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <input
                                type="file"
                                className="form-control mb-2"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploadingLogo}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm text-muted"
                                placeholder="Or enter image URL path (e.g. /images/logo.png)"
                                value={skillLogoUrl}
                                onChange={(e) => setSkillLogoUrl(e.target.value)}
                              />
                              {skillLogoUrl && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger mt-2"
                                  onClick={handleDeleteLogo}
                                  disabled={uploadingLogo}
                                >
                                  <i className="bi bi-trash me-1"></i> Delete Logo
                                </button>
                              )}
                              {uploadingLogo && (
                                <div className="mt-1 small text-primary">
                                  <span className="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" onClick={handleResetSkill} className="btn btn-outline-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary-warm px-4" disabled={loading || uploadingLogo}>Save</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Skills DataTable List */}
          <div className="admin-card mt-4 p-0 overflow-hidden">
            <DataTable
              data={skills}
              columns={skillColumns}
              searchPlaceholder="Search skills..."
              defaultSortKey="sort_order"
            />
          </div>
        </div>
      )}
    </div>
  );
}
