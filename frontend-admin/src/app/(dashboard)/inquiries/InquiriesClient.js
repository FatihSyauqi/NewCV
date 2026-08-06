"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/app/components/DataTable";

export default function InquiriesClient({ initialInquiries }) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const router = useRouter();

  const getFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/AdminFSyauqi")) return url;
    return `/AdminFSyauqi${url.startsWith("/") ? url : `/${url}`}`;
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact message?")) return;
    try {
      const res = await fetch("/AdminFSyauqi/api/inquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete inquiry");
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Sender Name",
      sortable: true,
      render: (item) => (
        <div>
          <div className="fw-bold text-dark">{item.name}</div>
          <small className="text-muted">{item.company_name || "-"}</small>
        </div>
      ),
    },
    {
      key: "purpose",
      label: "Purpose",
      sortable: true,
      render: (item) => (
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
          {item.purpose}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Contact Details",
      sortable: false,
      render: (item) => (
        <div className="small">
          <div><i className="bi bi-envelope me-1 text-muted"></i>{item.email}</div>
          <div><i className="bi bi-whatsapp me-1 text-success"></i>{item.phone}</div>
        </div>
      ),
    },
    {
      key: "files",
      label: "Attachments",
      sortable: false,
      render: (item) => {
        const fileUrls = item.files ? JSON.parse(item.files) : [];
        return fileUrls.length > 0 ? (
          <span className="badge bg-info-subtle text-info border border-info-subtle">
            <i className="bi bi-paperclip me-1"></i>{fileUrls.length} Files
          </span>
        ) : (
          <span className="text-muted small">-</span>
        );
      },
    },
    {
      key: "created_at",
      label: "Received At",
      sortable: true,
      render: (item) => (
        <small className="text-muted">
          {new Date(item.created_at).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-end",
      render: (item) => (
        <div className="d-inline-flex gap-2">
          <button
            onClick={() => setSelectedInquiry(item)}
            className="btn btn-sm btn-outline-primary"
            title="View Details"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button
            onClick={() => handleDelete(item.id)}
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Contact Inquiries</h1>
          <p className="text-muted mb-0">Messages and project proposals submitted via the frontend Contact Me form</p>
        </div>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <DataTable
          data={inquiries}
          columns={columns}
          searchPlaceholder="Search by name, email, phone, purpose..."
          defaultSortKey="created_at"
          defaultSortDir="desc"
        />
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom p-3">
                <h5 className="modal-title fw-bold text-dark">
                  Inquiry Details: {selectedInquiry.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedInquiry(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Sender Name</small>
                    <div className="fw-semibold text-dark fs-6">{selectedInquiry.name}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Purpose</small>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {selectedInquiry.purpose}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Email Address</small>
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary text-decoration-none fw-medium">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">WhatsApp / Phone</small>
                    <a href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-success text-decoration-none fw-medium">
                      {selectedInquiry.phone} <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                    </a>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Company Name</small>
                    <div className="fw-medium text-dark">{selectedInquiry.company_name || "-"}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Date Received</small>
                    <div className="fw-medium text-dark">{new Date(selectedInquiry.created_at).toLocaleString("id-ID")}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <small className="text-muted d-block mb-1 fw-bold">Message Content:</small>
                  <div className="p-3 bg-light rounded-3 border text-dark font-monospace small" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                    {selectedInquiry.message}
                  </div>
                </div>

                {((selectedInquiry.db_files && selectedInquiry.db_files.length > 0) || (selectedInquiry.files && JSON.parse(selectedInquiry.files).length > 0)) && (
                  <div>
                    <small className="text-muted d-block mb-2 fw-bold">Uploaded File Attachments:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedInquiry.db_files && selectedInquiry.db_files.length > 0 ? (
                        selectedInquiry.db_files.map((fileObj) => (
                          <a
                            key={fileObj.id}
                            href={getFileUrl(fileObj.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                          >
                            <i className={fileObj.file_name.endsWith(".pdf") ? "bi bi-file-earmark-pdf text-danger fs-6" : "bi bi-file-earmark-image text-primary fs-6"}></i>
                            <span className="fw-medium">{fileObj.file_name}</span>
                            <span className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                              ({(fileObj.file_size / 1024).toFixed(0)} KB)
                            </span>
                            <i className="bi bi-box-arrow-up-right small"></i>
                          </a>
                        ))
                      ) : (
                        JSON.parse(selectedInquiry.files).map((url, idx) => (
                          <a
                            key={idx}
                            href={getFileUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                          >
                            <i className={url.endsWith(".pdf") ? "bi bi-file-earmark-pdf text-danger fs-6" : "bi bi-file-earmark-image text-primary fs-6"}></i>
                            <span>Attachment {idx + 1}</span>
                            <i className="bi bi-box-arrow-up-right small"></i>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top p-3">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setSelectedInquiry(null)}
                >
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
