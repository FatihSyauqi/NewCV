"use client";

import { useState, useEffect } from "react";
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";

const COUNTRY_CODES = [
  { code: "+62", label: "ID +62" },
  { code: "+93", label: "AF +93" },
  { code: "+355", label: "AL +355" },
  { code: "+213", label: "DZ +213" },
  { code: "+376", label: "AD +376" },
  { code: "+244", label: "AO +244" },
  { code: "+54", label: "AR +54" },
  { code: "+374", label: "AM +374" },
  { code: "+61", label: "AU +61" },
  { code: "+43", label: "AT +43" },
  { code: "+994", label: "AZ +994" },
  { code: "+973", label: "BH +973" },
  { code: "+880", label: "BD +880" },
  { code: "+375", label: "BY +375" },
  { code: "+32", label: "BE +32" },
  { code: "+501", label: "BZ +501" },
  { code: "+229", label: "BJ +229" },
  { code: "+975", label: "BT +975" },
  { code: "+591", label: "BO +591" },
  { code: "+387", label: "BA +387" },
  { code: "+267", label: "BW +267" },
  { code: "+55", label: "BR +55" },
  { code: "+673", label: "BN +673" },
  { code: "+359", label: "BG +359" },
  { code: "+226", label: "BF +226" },
  { code: "+257", label: "BI +257" },
  { code: "+855", label: "KH +855" },
  { code: "+237", label: "CM +237" },
  { code: "+1", label: "CA +1" },
  { code: "+238", label: "CV +238" },
  { code: "+236", label: "CF +236" },
  { code: "+235", label: "TD +235" },
  { code: "+56", label: "CL +56" },
  { code: "+86", label: "CN +86" },
  { code: "+57", label: "CO +57" },
  { code: "+269", label: "KM +269" },
  { code: "+242", label: "CG +242" },
  { code: "+506", label: "CR +506" },
  { code: "+385", label: "HR +385" },
  { code: "+53", label: "CU +53" },
  { code: "+357", label: "CY +357" },
  { code: "+420", label: "CZ +420" },
  { code: "+45", label: "DK +45" },
  { code: "+253", label: "DJ +253" },
  { code: "+593", label: "EC +593" },
  { code: "+20", label: "EG +20" },
  { code: "+503", label: "SV +503" },
  { code: "+240", label: "GQ +240" },
  { code: "+372", label: "EE +372" },
  { code: "+251", label: "ET +251" },
  { code: "+679", label: "FJ +679" },
  { code: "+358", label: "FI +358" },
  { code: "+33", label: "FR +33" },
  { code: "+241", label: "GA +241" },
  { code: "+220", label: "GM +220" },
  { code: "+995", label: "GE +995" },
  { code: "+49", label: "DE +49" },
  { code: "+233", label: "GH +233" },
  { code: "+30", label: "GR +30" },
  { code: "+502", label: "GT +502" },
  { code: "+224", label: "GN +224" },
  { code: "+592", label: "GY +592" },
  { code: "+509", label: "HT +509" },
  { code: "+504", label: "HN +504" },
  { code: "+852", label: "HK +852" },
  { code: "+36", label: "HU +36" },
  { code: "+354", label: "IS +354" },
  { code: "+91", label: "IN +91" },
  { code: "+98", label: "IR +98" },
  { code: "+964", label: "IQ +964" },
  { code: "+353", label: "IE +353" },
  { code: "+972", label: "IL +972" },
  { code: "+39", label: "IT +39" },
  { code: "+225", label: "CI +225" },
  { code: "+81", label: "JP +81" },
  { code: "+962", label: "JO +962" },
  { code: "+7", label: "KZ +7" },
  { code: "+254", label: "KE +254" },
  { code: "+965", label: "KW +965" },
  { code: "+996", label: "KG +996" },
  { code: "+856", label: "LA +856" },
  { code: "+371", label: "LV +371" },
  { code: "+961", label: "LB +961" },
  { code: "+266", label: "LS +266" },
  { code: "+231", label: "LR +231" },
  { code: "+218", label: "LY +218" },
  { code: "+423", label: "LI +423" },
  { code: "+370", label: "LT +370" },
  { code: "+352", label: "LU +352" },
  { code: "+853", label: "MO +853" },
  { code: "+389", label: "MK +389" },
  { code: "+261", label: "MG +261" },
  { code: "+265", label: "MW +265" },
  { code: "+60", label: "MY +60" },
  { code: "+960", label: "MV +960" },
  { code: "+223", label: "ML +223" },
  { code: "+356", label: "MT +356" },
  { code: "+222", label: "MR +222" },
  { code: "+230", label: "MU +230" },
  { code: "+52", label: "MX +52" },
  { code: "+373", label: "MD +373" },
  { code: "+377", label: "MC +377" },
  { code: "+976", label: "MN +976" },
  { code: "+382", label: "ME +382" },
  { code: "+212", label: "MA +212" },
  { code: "+258", label: "MZ +258" },
  { code: "+95", label: "MM +95" },
  { code: "+264", label: "NA +264" },
  { code: "+977", label: "NP +977" },
  { code: "+31", label: "NL +31" },
  { code: "+64", label: "NZ +64" },
  { code: "+505", label: "NI +505" },
  { code: "+227", label: "NE +227" },
  { code: "+234", label: "NG +234" },
  { code: "+47", label: "NO +47" },
  { code: "+968", label: "OM +968" },
  { code: "+92", label: "PK +92" },
  { code: "+970", label: "PS +970" },
  { code: "+507", label: "PA +507" },
  { code: "+675", label: "PG +675" },
  { code: "+595", label: "PY +595" },
  { code: "+51", label: "PE +51" },
  { code: "+63", label: "PH +63" },
  { code: "+48", label: "PL +48" },
  { code: "+351", label: "PT +351" },
  { code: "+974", label: "QA +974" },
  { code: "+40", label: "RO +40" },
  { code: "+7", label: "RU +7" },
  { code: "+250", label: "RW +250" },
  { code: "+966", label: "SA +966" },
  { code: "+221", label: "SN +221" },
  { code: "+381", label: "RS +381" },
  { code: "+65", label: "SG +65" },
  { code: "+421", label: "SK +421" },
  { code: "+386", label: "SI +386" },
  { code: "+252", label: "SO +252" },
  { code: "+27", label: "ZA +27" },
  { code: "+82", label: "KR +82" },
  { code: "+34", label: "ES +34" },
  { code: "+94", label: "LK +94" },
  { code: "+249", label: "SD +249" },
  { code: "+597", label: "SR +597" },
  { code: "+46", label: "SE +46" },
  { code: "+41", label: "CH +41" },
  { code: "+963", label: "SY +963" },
  { code: "+886", label: "TW +886" },
  { code: "+992", label: "TJ +992" },
  { code: "+255", label: "TZ +255" },
  { code: "+66", label: "TH +66" },
  { code: "+670", label: "TL +670" },
  { code: "+228", label: "TG +228" },
  { code: "+216", label: "TN +216" },
  { code: "+90", label: "TR +90" },
  { code: "+993", label: "TM +993" },
  { code: "+256", label: "UG +256" },
  { code: "+380", label: "UA +380" },
  { code: "+971", label: "AE +971" },
  { code: "+44", label: "UK +44" },
  { code: "+1", label: "US +1" },
  { code: "+598", label: "UY +598" },
  { code: "+998", label: "UZ +998" },
  { code: "+58", label: "VE +58" },
  { code: "+84", label: "VN +84" },
  { code: "+967", label: "YE +967" },
  { code: "+260", label: "ZM +260" },
  { code: "+263", label: "ZW +263" }
];

export default function ContactModal({ isOpen, initialPurpose = "Contract / Project Development", onClose }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState(initialPurpose);
  const [otherPurpose, setOtherPurpose] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Math Captcha State
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(5);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setNum1(n1);
    setNum2(n2);
    setCaptchaAnswer("");
  };

  useEffect(() => {
    if (isOpen) {
      setPurpose(initialPurpose || "Contract / Project Development");
      generateCaptcha();
    }
  }, [isOpen, initialPurpose]);

  if (!isOpen) return null;

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const triggerError = (msg) => {
    if (typeof window !== "undefined" && iziToast) {
      iziToast.error({
        title: "Peringatan",
        message: msg,
        position: "topRight",
        transitionIn: "fadeInDown",
        transitionOut: "fadeOutUp",
        timeout: 5000,
        progressBarColor: "#ef4444",
        backgroundColor: "#ffffff",
        titleColor: "#991b1b",
        messageColor: "#374151",
        icon: "bi bi-exclamation-triangle-fill",
        iconColor: "#dc2626",
        animateInside: true,
        close: true,
        displayMode: 2,
      });
    }
  };

  const showSuccessToast = (msg) => {
    if (typeof window !== "undefined" && iziToast) {
      iziToast.success({
        title: "Berhasil!",
        message: msg,
        position: "topRight",
        transitionIn: "fadeInDown",
        transitionOut: "fadeOutUp",
        timeout: 5000,
        progressBarColor: "#10b981",
        backgroundColor: "#ffffff",
        titleColor: "#065f46",
        messageColor: "#374151",
        icon: "bi bi-check-circle-fill",
        iconColor: "#059669",
        animateInside: true,
        close: true,
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        triggerError(`File "${f.name}" melebihi batas 2MB. Silakan pilih file yang lebih kecil.`);
        return;
      }
      validFiles.push(f);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = ""; // Reset file input
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation Name
    if (!name.trim()) {
      triggerError("Nama Lengkap wajib diisi!");
      return;
    }

    // 2. Validation Purpose
    if (purpose === "Lainnya" && !otherPurpose.trim()) {
      triggerError("Silakan tuliskan detail tujuan kontak Anda!");
      return;
    }

    // 3. Validation Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      triggerError("Format alamat email tidak valid! (Contoh: nama@domain.com)");
      return;
    }

    // 4. Validation Phone Number & Country Code Formatting
    let cleanPhone = phone.trim().replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 15) {
      triggerError("Nomor HP / WhatsApp tidak valid! Harap masukkan 7 - 15 digit angka.");
      return;
    }

    const fullPhone = `${countryCode}${cleanPhone}`;

    // 5. Validation Message
    if (!message.trim()) {
      triggerError("Pesan yang ingin disampaikan wajib diisi!");
      return;
    }

    // 6. Client-side Captcha Validation
    if (parseInt(captchaAnswer, 10) !== num1 + num2) {
      triggerError(`Jawaban Verifikasi Keamanan salah (${num1} + ${num2} ≠ ${captchaAnswer || 'kosong'}). Silakan coba lagi!`);
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("purpose", purpose);
      if (purpose === "Lainnya") {
        formData.append("other_purpose", otherPurpose.trim());
      }
      formData.append("phone", fullPhone);
      formData.append("email", email.trim());
      formData.append("company_name", companyName.trim());
      formData.append("message", message.trim());

      // Pass Captcha values for server-side verification
      formData.append("captcha_num1", num1.toString());
      formData.append("captcha_num2", num2.toString());
      formData.append("captcha_answer", captchaAnswer.toString());

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        generateCaptcha();
        throw new Error(data.error || "Gagal mengirim pesan.");
      }

      setSuccess(true);
      showSuccessToast("Pesan Anda telah berhasil terkirim via Telegram!");
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setName("");
        setPurpose("Contract / Project Development");
        setOtherPurpose("");
        setCountryCode("+62");
        setPhone("");
        setEmail("");
        setCompanyName("");
        setMessage("");
        setSelectedFiles([]);
        generateCaptcha();
      }, 2500);
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1060, backdropFilter: "blur(5px)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom border-light p-4 bg-primary text-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                <i className="bi bi-envelope-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0 fs-5">Hubungi Fatih Syauqi</h5>
                <small className="text-white-50">Isi formulir di bawah ini untuk memulai diskusi atau penawaran kerja</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
              disabled={loading}
            ></button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              {success ? (
                <div className="text-center py-5">
                  <div className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3" style={{ width: "72px", height: "72px" }}>
                    <i className="bi bi-check-circle-fill display-5"></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-2">Pesan Berhasil Terkirim!</h4>
                  <p className="text-muted mb-0">
                    Terima kasih telah menghubungi kami. Pesan dan lampiran Anda telah diteruskan dan akan kami tanggapi secepatnya.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {/* Nama */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      Nama Lengkap <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-light-subtle text-muted">
                        <i className="bi bi-person"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control text-capitalize"
                        placeholder="Contoh: Fariz Hanif Arrayhan"
                        value={name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setName(val.replace(/\b[a-zA-Z]/g, (c) => c.toUpperCase()));
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Tujuan */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      Tujuan Kontak <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-light-subtle text-muted">
                        <i className="bi bi-bullseye"></i>
                      </span>
                      <select
                        className="form-select fw-semibold"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        required
                      >
                        <option value="Contract / Project Development">Contract / Project Development</option>
                        <option value="Request Resume PDF">Request Resume PDF</option>
                        <option value="Hiring / Direct Recruitment">Hiring / Direct Recruitment</option>
                        <option value="Konsultasi IT & Architecture">Konsultasi IT &amp; Architecture</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* Textbox jika memilih "Lainnya" */}
                  {purpose === "Lainnya" && (
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Sebutkan Detail Tujuan Kontak <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-light-subtle text-muted">
                          <i className="bi bi-pencil"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tuliskan tujuan kontak Anda di sini..."
                          value={otherPurpose}
                          onChange={(e) => setOtherPurpose(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* No HP/WA with Country Code Prefix */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      No HP / WhatsApp <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <select
                        className="form-select bg-light border-light-subtle fw-semibold"
                        style={{ maxWidth: "105px" }}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        className="form-control"
                        placeholder="81234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      Alamat Email <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-light-subtle text-muted">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Contoh: name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Nama Usaha */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Nama Usaha / Perusahaan <span className="text-muted fw-normal">(Opsional)</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-light-subtle text-muted">
                        <i className="bi bi-building"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: PT Solusi Teknologi Indonesia"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Pesan */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Pesan yang Ingin Disampaikan <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Tuliskan detail kebutuhan proyek, posisi lowongan, atau pertanyaan Anda di sini..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {/* Upload File */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Upload File / Dokumen <span className="text-muted fw-normal">(PDF, Gambar - Max 2MB per file)</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,image/*"
                      multiple
                      onChange={handleFileChange}
                    />

                    {/* Selected files preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 d-flex flex-column gap-2">
                        <small className="fw-semibold text-muted">Lampiran Terpilih ({selectedFiles.length}):</small>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="d-inline-flex align-items-center gap-2 px-3 py-1.5 bg-light border rounded-3 text-dark small"
                            >
                              <i className={file.name.endsWith(".pdf") ? "bi bi-file-earmark-pdf text-danger fs-6" : "bi bi-file-earmark-image text-primary fs-6"}></i>
                              <span className="fw-medium text-truncate" style={{ maxWidth: "160px" }}>{file.name}</span>
                              <span className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                                ({(file.size / 1024).toFixed(0)} KB)
                              </span>
                              <button
                                type="button"
                                className="btn-close ms-1"
                                style={{ fontSize: "0.65rem" }}
                                onClick={() => handleRemoveFile(idx)}
                              ></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Security Verification */}
                  <div className="col-12 mt-2 pt-3 border-top border-light-subtle">
                    <div
                      className="p-3 rounded-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
                        border: "1.5px solid rgba(2, 132, 199, 0.2)",
                        borderRadius: "16px"
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                          style={{ width: "42px", height: "42px" }}
                        >
                          <i className="bi bi-shield-check fs-5"></i>
                        </div>
                        <div>
                          <label className="form-label mb-0 small fw-bold text-dark d-block">
                            Verifikasi Keamanan <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className="small text-muted">Berapakah hasil dari:</span>
                            <span className="badge bg-primary text-white fs-6 px-3 py-1.5 rounded-pill font-monospace shadow-sm">
                              {num1} + {num2} = ?
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2" style={{ minWidth: "160px" }}>
                        <input
                          type="number"
                          className="form-control form-control-lg text-center font-monospace fw-bold border-primary rounded-pill shadow-sm"
                          placeholder="Jawaban"
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          required
                          style={{ fontSize: "1rem" }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                          style={{ width: "40px", height: "40px" }}
                          onClick={generateCaptcha}
                          title="Acak Pertanyaan"
                        >
                          <i className="bi bi-arrow-clockwise fs-5"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!success && (
              <div className="modal-footer border-top border-light p-3 bg-light d-flex justify-content-between align-items-center">
                <small className="text-muted fw-medium d-flex align-items-center gap-1">
                  <i className="bi bi-shield-check text-success fs-6"></i>
                  <span>Data Anda aman dan terjaga kerahasiannya</span>
                </small>
                <div className="d-flex gap-2.5">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 rounded-pill"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    onMouseEnter={() => setBtnHovered(true)}
                    onMouseLeave={() => setBtnHovered(false)}
                    className="btn px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 text-white shadow"
                    style={{
                      background: btnHovered
                        ? "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)"
                        : "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                      border: "none",
                      borderRadius: "50px",
                      transform: btnHovered ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)",
                      boxShadow: btnHovered
                        ? "0 8px 24px rgba(2, 132, 199, 0.45)"
                        : "0 4px 14px rgba(2, 132, 199, 0.3)",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "0.95rem"
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill fs-6"></i>
                        <span>Kirim Pesan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
