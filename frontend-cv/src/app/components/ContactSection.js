"use client";

import { useState } from "react";
import ContactModal from "./ContactModal";

export default function ContactSection({ email }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialPurpose, setInitialPurpose] = useState("Contract / Project Development");

  const openWithPurpose = (purpose) => {
    setInitialPurpose(purpose);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="d-flex flex-column gap-2">
        <button
          type="button"
          onClick={() => openWithPurpose("Contract / Project Development")}
          className="btn-highlighted d-flex align-items-center justify-content-center gap-2 border-0 w-100 py-3"
          style={{ cursor: "pointer" }}
        >
          <i className="bi bi-envelope-fill fs-5"></i>
          <span className="fw-bold fs-6">Contact Me</span>
        </button>

        <button
          type="button"
          onClick={() => openWithPurpose("Request Resume PDF")}
          className="btn btn-warm-outline d-flex align-items-center justify-content-center gap-2 w-100 py-2.5"
          style={{ cursor: "pointer" }}
        >
          <i className="bi bi-file-earmark-pdf-fill fs-6"></i>
          <span>Request Resume PDF</span>
        </button>
      </div>

      {/* Interactive Contact Form Modal */}
      <ContactModal
        isOpen={isModalOpen}
        initialPurpose={initialPurpose}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
