"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WysiwygEditor from "./WysiwygEditor";
import { sanitizeHtml } from "@/lib/sanitizer";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingInit, setLoadingInit] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Visitor History State
  const [visitorDeviceId, setVisitorDeviceId] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pre-chat Form State
  const [initForm, setInitForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    initial_message: ""
  });
  const [initError, setInitError] = useState("");

  // Chat message input, attachment caption & MS Teams Quoted Messages
  const [messageHtml, setMessageHtml] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [quotedMessages, setQuotedMessages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMsgLengthRef = useRef(0);

  // Initialize Visitor Device ID and load saved session tokens from localStorage
  useEffect(() => {
    let vid = localStorage.getItem("cv_visitor_id");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("cv_visitor_id", vid);
    }
    setVisitorDeviceId(vid);

    const savedToken = localStorage.getItem("cv_chat_token");
    if (savedToken) {
      setSessionToken(savedToken);
    }
  }, []);

  // Save session token to local history array
  const saveTokenToHistory = (token) => {
    try {
      const historyStr = localStorage.getItem("cv_chat_history_tokens");
      let tokens = historyStr ? JSON.parse(historyStr) : [];
      if (!tokens.includes(token)) {
        tokens.unshift(token);
        localStorage.setItem("cv_chat_history_tokens", JSON.stringify(tokens));
      }
    } catch (e) {}
  };

  // Fetch all past chat sessions performed on this device/browser
  const fetchUserChatHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const vid = visitorDeviceId || localStorage.getItem("cv_visitor_id") || "";
      const historyStr = localStorage.getItem("cv_chat_history_tokens");
      let tokens = historyStr ? JSON.parse(historyStr) : [];
      if (sessionToken && !tokens.includes(sessionToken)) {
        tokens.unshift(sessionToken);
      }

      const queryParams = new URLSearchParams();
      if (vid) queryParams.append("visitor_id", vid);
      if (tokens.length > 0) queryParams.append("tokens", tokens.join(","));

      const res = await fetch(`/api/chat/history?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data.sessions || []);

        // Auto-select latest active session if no session selected yet
        if (!sessionToken && data.sessions && data.sessions.length > 0) {
          const latest = data.sessions[0];
          setSessionToken(latest.session_token);
          localStorage.setItem("cv_chat_token", latest.session_token);
        }
      }
    } catch (err) {
      console.error("Fetch user chat history error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [visitorDeviceId, sessionToken]);

  useEffect(() => {
    if (isOpen) {
      fetchUserChatHistory();
    }
  }, [isOpen, fetchUserChatHistory]);

  const prevAdminMsgCountRef = useRef(-1);

  // Audio Chime notification synthesizer (Crisp Slack/WhatsApp style crystal chime)
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      // Dual-tone crystal chime (E5 -> B5)
      [659.25, 987.77].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.20, now + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.40);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.40);
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  // Unlock AudioContext on first user click/touch anywhere
  useEffect(() => {
    const handleUnlock = () => {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    };
    window.addEventListener("click", handleUnlock, { once: true });
    window.addEventListener("keydown", handleUnlock, { once: true });
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
    };
  }, []);

  // Poll for messages if active session exists
  useEffect(() => {
    if (!sessionToken) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?token=${sessionToken}`);
        if (!res.ok) {
          if (res.status === 444) {
            localStorage.removeItem("cv_chat_token");
            setSessionToken(null);
            setSessionData(null);
          }
          return;
        }

        const data = await res.json();
        setSessionData(data.session);
        setMessages(data.messages || []);

        const adminMsgs = (data.messages || []).filter(m => m.sender_type === 'admin');
        const currentAdminCount = adminMsgs.length;

        // Play chime sound when a new message arrives from admin
        if (prevAdminMsgCountRef.current !== -1 && currentAdminCount > prevAdminMsgCountRef.current) {
          playNotificationSound();
        }
        prevAdminMsgCountRef.current = currentAdminCount;
      } catch (err) {
        console.error("Poll chat error:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [sessionToken, playNotificationSound]);

  // Track user scroll position in chat container
  const handleChatScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 80;
  };

  // Always auto-scroll to bottom on new message or when window is opened
  useEffect(() => {
    if (!isOpen) return;

    const hasNewMsg = messages.length > prevMsgLengthRef.current;
    prevMsgLengthRef.current = messages.length;

    if (hasNewMsg) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen]);

  // When chat window is opened, scroll to bottom once
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [isOpen]);

  // Add a message to MS Teams Quote Reply list
  const handleQuoteMessage = (msg) => {
    if (quotedMessages.some((q) => q.id === msg.id)) return;
    const rawText = (msg.message_html || "").replace(/<[^>]+>/g, "").trim();
    const snippet = rawText || msg.attachment_name || "Attachment";

    setQuotedMessages((prev) => [
      ...prev,
      {
        id: msg.id,
        sender_name: msg.sender_name,
        created_at: msg.created_at,
        text_snippet: snippet
      }
    ]);
  };

  const removeQuotedMessage = (id) => {
    setQuotedMessages((prev) => prev.filter((q) => q.id !== id));
  };

  // Handle Pre-Chat Form submission
  const handleInitSubmit = async (e) => {
    e.preventDefault();
    setInitError("");
    setLoadingInit(true);

    try {
      const vid = visitorDeviceId || localStorage.getItem("cv_visitor_id");
      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initForm,
          visitor_device_id: vid
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai obrolan");

      localStorage.setItem("cv_chat_token", data.session_token);
      saveTokenToHistory(data.session_token);
      setSessionToken(data.session_token);
      setShowHistoryMenu(false);
      playNotificationSound();
    } catch (err) {
      setInitError(err.message);
    } finally {
      setLoadingInit(false);
    }
  };

  // State for Drag & Drop Overlay
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Validate and Upload File (Drag & Drop + File Input Picker)
  const validateAndUploadFile = async (file) => {
    if (!file) return;

    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      alert("Format file tidak diizinkan! Hanya file Gambar (PNG, JPG, WEBP), PDF, dan Word (DOC, DOCX) yang diperbolehkan.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal ukuran file yang diizinkan adalah 2 MB.");
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");

      setAttachment({
        url: data.file_url,
        name: data.file_name,
        size: data.file_size
      });
      setAttachmentCaption("");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) validateAndUploadFile(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUploadFile(file);
    }
  };

  // Build MS Teams Quoted Block HTML
  const buildQuotedHtml = () => {
    if (quotedMessages.length === 0) return "";

    return quotedMessages
      .map(
        (q) =>
          `<blockquote class="ms-teams-quote-block" style="border-left: 3px solid #3b82f6; background-color: #f8fafc; color: #1e293b; padding: 6px 10px; margin: 0 0 8px 0; border-radius: 4px; font-size: 0.85rem;">
            <div style="font-weight: 700; color: #1e293b;">${q.sender_name} <span style="font-weight: normal; color: #64748b; font-size: 0.75rem;">${new Date(q.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></div>
            <div style="color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;">${q.text_snippet}</div>
          </blockquote>`
      )
      .join("");
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!messageHtml.trim() && !attachment && quotedMessages.length === 0) return;
    if (sendingMessage) return;

    setSendingMessage(true);
    try {
      const quoteHtml = buildQuotedHtml();
      let contentBody = messageHtml || "";
      if (attachmentCaption.trim()) {
        contentBody += `<div class="attachment-caption fw-semibold mb-1" style="color: #1e293b !important; font-weight: 600; font-size: 0.95rem; font-style: normal;"><i class="bi bi-card-text me-1 text-primary"></i> ${attachmentCaption.trim()}</div>`;
      }
      const finalMessageHtml = quoteHtml + contentBody;

      const payload = {
        session_token: sessionToken,
        message_html: finalMessageHtml,
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_size: attachment?.size || null
      };

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
          alert(data.error);
        } else {
          throw new Error(data.error || "Gagal mengirim pesan");
        }
        return;
      }

      setMessageHtml("");
      setAttachment(null);
      setAttachmentCaption("");
      setQuotedMessages([]);

      isUserScrolledUpRef.current = false;

      const msgRes = await fetch(`/api/chat/messages?token=${sessionToken}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Select a session from history
  const handleSelectHistorySession = (session) => {
    localStorage.setItem("cv_chat_token", session.session_token);
    saveTokenToHistory(session.session_token);
    setSessionToken(session.session_token);
    setShowHistoryMenu(false);
  };

  // Handle Close Session from Visitor
  const handleUserCloseSession = async () => {
    if (confirm("Apakah Anda yakin ingin mengakhiri sesi chat ini?")) {
      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: sessionToken, action: "close_session" })
        });
        setSessionData((prev) => prev ? { ...prev, status: "closed", closed_by: "user" } : null);
        fetchUserChatHistory();
      } catch (err) {
        console.error("Close session error:", err);
      }
    }
  };

  // Open Form to Start New Chat Session
  const handleStartNewSession = () => {
    setSessionToken(null);
    setSessionData(null);
    setMessages([]);
    setQuotedMessages([]);
    setShowHistoryMenu(false);
    setInitForm({ full_name: "", email: "", phone_number: "", initial_message: "" });
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const unreadCount = sessionData?.unread_user || 0;
  const isSessionClosed = sessionData?.status === "closed";
  const isSessionBlocked = sessionData?.status === "blocked";

  return (
    <div className="live-chat-fixed-container" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* ── Chat Popup Window ── */}
      {isOpen && (
        <div
          className="card border-0 shadow-lg rounded-4 overflow-hidden mb-3 animate-fade-in position-relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: "430px",
            maxWidth: "calc(100vw - 32px)",
            height: "590px",
            maxHeight: "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 50px rgba(37, 99, 235, 0.22)",
            border: "1px solid rgba(59, 130, 246, 0.2)"
          }}
        >
          {/* ── DRAG & DROP OVERLAY ── */}
          {isDraggingFile && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-90 d-flex flex-column align-items-center justify-content-center text-white p-3 shadow-lg"
              style={{ zIndex: 10000, backdropFilter: "blur(4px)", pointerEvents: "none" }}
            >
              <i className="bi bi-cloud-arrow-up-fill display-3 mb-2 animate-bounce"></i>
              <h5 className="fw-bold mb-1">Lepaskan File di Sini</h5>
              <p className="small mb-0 text-white-50">Maksimal 2 MB (Gambar PNG/JPG, PDF, Word)</p>
            </div>
          )}
          {/* Header Soft Blue dengan Teks Kontras Tinggi */}
          <div
            className="p-3 text-white d-flex align-items-center justify-content-between"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative me-1">
                <div
                  className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center shadow-xs"
                  style={{ width: "42px", height: "42px", fontSize: "0.95rem" }}
                >
                  FS
                </div>
                <span
                  className={`position-absolute bottom-0 end-0 border border-2 border-primary rounded-circle ${isSessionClosed || isSessionBlocked ? 'bg-secondary' : 'bg-success'}`}
                  style={{ width: "12px", height: "12px" }}
                ></span>
              </div>
              <div>
                <h6 className="mb-0 fw-bold fs-6 text-white tracking-wide">Live Chat</h6>
                <small className="text-white d-block fw-semibold" style={{ fontSize: "11px", color: "#ffffff", opacity: 0.95 }}>
                  Fatih Syauqi • Senior Software Engineer
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              {/* History Button */}
              <button
                type="button"
                className={`btn btn-sm btn-link text-white p-1.5 hover-opacity-75 ${showHistoryMenu ? 'bg-white-20 rounded' : ''}`}
                onClick={() => {
                  setShowHistoryMenu((prev) => !prev);
                  if (!showHistoryMenu) fetchUserChatHistory();
                }}
                title="Riwayat Sesi Percakapan"
              >
                <i className="bi bi-clock-history fs-5"></i>
              </button>

              {sessionToken && !isSessionClosed && !isSessionBlocked && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-white p-1.5 hover-opacity-75"
                  onClick={handleUserCloseSession}
                  title="Akhiri Sesi Chat Ini"
                >
                  <i className="bi bi-box-arrow-right fs-5"></i>
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-link text-white p-1.5 hover-opacity-75"
                onClick={() => setIsOpen(false)}
                title="Tutup Window"
              >
                <i className="bi bi-x-lg fs-5"></i>
              </button>
            </div>
          </div>

          {/* ── HISTORY DRAWER OVERLAY ── */}
          {showHistoryMenu ? (
            <div className="p-3 bg-slate-50 flex-grow-1 overflow-y-auto d-flex flex-column justify-content-between" style={{ backgroundColor: "#f8fafc" }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="mb-0 fw-bold text-slate-800" style={{ color: "#1e293b", fontSize: "14px" }}>
                    <i className="bi bi-clock-history text-primary me-2"></i> Riwayat Percakapan Anda
                  </h6>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary rounded-pill px-3 fw-semibold"
                    onClick={handleStartNewSession}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Chat Baru
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-4 text-muted small">
                    <span className="spinner-border spinner-border-sm me-2"></span> Memuat riwayat chat...
                  </div>
                ) : pastSessions.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    Belum ada riwayat percakapan di perangkat ini.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {pastSessions.map((s) => {
                      const isCurrent = s.session_token === sessionToken;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectHistorySession(s)}
                          className={`p-3 rounded-3 border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-white border-primary border-2 shadow-xs"
                              : "bg-white border-slate-200 hover-border-primary"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fw-bold text-dark text-truncate" style={{ fontSize: "13px", maxWidth: "200px" }}>
                              {s.initial_message || s.full_name}
                            </span>
                            <small className="text-muted" style={{ fontSize: "10px" }}>
                              {new Date(s.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            </small>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mt-1">
                            <small className="text-muted text-truncate" style={{ fontSize: "11px", maxWidth: "220px" }}>
                              {s.full_name} ({s.email})
                            </small>
                            <span
                              className={`badge ${
                                s.status === "active"
                                  ? "bg-success-subtle text-success"
                                  : s.status === "blocked"
                                  ? "bg-danger-subtle text-danger"
                                  : "bg-secondary-subtle text-secondary"
                              }`}
                              style={{ fontSize: "10px" }}
                            >
                              {s.status === "active" ? "Aktif" : s.status === "blocked" ? "Diblokir" : "Tutup"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 mt-3 rounded-pill"
                onClick={() => setShowHistoryMenu(false)}
              >
                Kembali ke Percakapan Saat Ini
              </button>
            </div>
          ) : (
            /* Body Section */
            !sessionToken ? (
              /* ── STATE 1: Pre-Chat Form ── */
              <div className="p-4 bg-slate-50 flex-grow-1 overflow-y-auto d-flex flex-column justify-content-between" style={{ backgroundColor: "#f8fafc" }}>
                <div>
                  <div className="text-center mb-3">
                    <h6 className="fw-bold text-slate-800 mb-1" style={{ color: "#1e293b" }}>Mulai Obrolan Langsung</h6>
                    <p className="small text-muted mb-0" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      Isi data formulir di bawah ini untuk memulai konsultasi teknis atau kustomisasi project.
                    </p>
                  </div>

                  {initError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3 border-0 shadow-xs" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i> {initError}
                    </div>
                  )}

                  <form id="chatInitForm" onSubmit={handleInitSubmit}>
                    <div className="mb-2.5">
                      <label className="form-label small fw-semibold text-slate-700 mb-1" style={{ fontSize: "12px", color: "#334155" }}>
                        Nama Lengkap <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-slate-200"
                        placeholder="e.g. Budi Santoso"
                        value={initForm.full_name}
                        onChange={(e) => setInitForm({ ...initForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-2.5">
                      <label className="form-label small fw-semibold text-slate-700 mb-1" style={{ fontSize: "12px", color: "#334155" }}>
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-sm border-slate-200"
                        placeholder="e.g. budi@perusahaan.com"
                        value={initForm.email}
                        onChange={(e) => setInitForm({ ...initForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-2.5">
                      <label className="form-label small fw-semibold text-slate-700 mb-1" style={{ fontSize: "12px", color: "#334155" }}>
                        No. Handphone / WhatsApp <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control form-control-sm border-slate-200"
                        placeholder="e.g. 081234567890"
                        value={initForm.phone_number}
                        onChange={(e) => setInitForm({ ...initForm, phone_number: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-slate-700 mb-1" style={{ fontSize: "12px", color: "#334155" }}>
                        Pesan Awal / Kebutuhan Project <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control form-control-sm border-slate-200"
                        rows={3}
                        placeholder="Halo Kak Fatih, saya mau konsultasi pembuatan aplikasi..."
                        value={initForm.initial_message}
                        onChange={(e) => setInitForm({ ...initForm, initial_message: e.target.value })}
                        required
                      />
                    </div>
                  </form>
                </div>

                <button
                  type="submit"
                  form="chatInitForm"
                  className="btn w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 text-white border-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", borderRadius: "10px" }}
                  disabled={loadingInit}
                >
                  {loadingInit ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-envelope-fill"></i>
                      <span>Mulai Chat Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ── STATE 2: Active Chat Interface (With Tech Doodle Background) ── */
              <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                {/* Message List area with tech doodles background */}
                <div
                  ref={chatBodyRef}
                  onScroll={handleChatScroll}
                  className="p-3 flex-grow-1 overflow-y-auto"
                  style={{
                    backgroundImage: "linear-gradient(rgba(248, 250, 252, 0.90), rgba(248, 250, 252, 0.90)), url('/images/tech-doodles-bg.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted small my-4">
                      Belum ada pesan. Ketik pesan Anda di bawah.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.sender_type === "user";
                      const cleanHtml = sanitizeHtml(msg.message_html);

                      return (
                        <div
                          key={msg.id}
                          className={`d-flex flex-column mb-3 position-relative group-chat-item ${isUser ? "align-items-end" : "align-items-start"}`}
                        >
                          <div className="d-flex align-items-center gap-1.5 mb-1 px-1">
                            <small className="fw-semibold text-slate-700" style={{ fontSize: "11px", color: "#475569" }}>
                              {msg.sender_name}
                            </small>
                            <small className="text-slate-500" style={{ fontSize: "10px", color: "#64748b" }}>
                              • {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </small>
                            {!isSessionClosed && !isSessionBlocked && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-primary p-0 ms-1 text-decoration-none d-inline-flex align-items-center gap-0.5 opacity-80 hover-opacity-100"
                                onClick={() => handleQuoteMessage(msg)}
                                title="Reply / Kutip Pesan Ini"
                                style={{ fontSize: "11px", lineHeight: "1" }}
                              >
                                <i className="bi bi-reply-fill"></i>
                                <span>Reply</span>
                              </button>
                            )}
                          </div>

                          {/* White Background Bubble dengan Font Warna Hitam */}
                          <div
                            className="p-3 shadow-xs bg-white text-slate-800 border"
                            style={{
                              maxWidth: "88%",
                              fontSize: "0.92rem",
                              lineHeight: "1.5",
                              background: "#ffffff",
                              color: "#1e293b",
                              borderColor: "#e2e8f0",
                              borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                            }}
                          >
                            {/* Rich Text Sanitized HTML Body */}
                            {cleanHtml && (
                              <div
                                className="message-rich-content"
                                style={{ color: "#1e293b" }}
                                dangerouslySetInnerHTML={{ __html: cleanHtml }}
                              />
                            )}

                            {/* Attachment Card */}
                            {msg.attachment_url && (
                              <div className="mt-2 pt-2 border-top border-slate-200">
                                {isImageFile(msg.attachment_url) ? (
                                  <div>
                                    <img
                                      src={msg.attachment_url}
                                      alt={msg.attachment_name || "Attachment"}
                                      className="img-fluid rounded border shadow-xs cursor-pointer"
                                      style={{ maxHeight: "200px", objectFit: "cover" }}
                                      onClick={() => setPreviewFile({ url: msg.attachment_url, name: msg.attachment_name || "Gambar", size: msg.attachment_size })}
                                      title="Klik untuk memperbesar gambar"
                                    />
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded-3 bg-slate-50 text-slate-800 border shadow-2xs">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                      <i className="bi bi-file-earmark-text-fill fs-4 text-primary"></i>
                                      <div className="text-truncate" style={{ maxWidth: "160px" }}>
                                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: "12px" }}>{msg.attachment_name || "File Document"}</div>
                                        <small className="text-muted fw-semibold" style={{ fontSize: "10px" }}>{formatFileSize(msg.attachment_size)}</small>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1.5">
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-outline-primary fw-semibold rounded-pill py-0.5 px-2.5"
                                        style={{ fontSize: "11px" }}
                                        onClick={() => setPreviewFile({ url: msg.attachment_url, name: msg.attachment_name || "Dokumen", size: msg.attachment_size })}
                                      >
                                        <i className="bi bi-eye-fill me-1"></i> Preview
                                      </button>
                                      <a
                                        href={msg.attachment_url}
                                        download
                                        className="btn btn-xs btn-outline-secondary fw-semibold rounded-pill py-0.5 px-2.5"
                                        style={{ fontSize: "11px" }}
                                      >
                                        <i className="bi bi-download me-1"></i> Download
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Status Notice Banner if Session is Closed or Blocked */}
                {isSessionClosed ? (
                  <div className="p-3 bg-light border-top text-center shadow-xs">
                    <div className="alert alert-secondary small mb-2 py-2 px-3 border-0 fw-semibold text-dark">
                      <i className="bi bi-lock-fill text-primary me-1"></i>
                      Sesi obrolan ini telah diakhiri {sessionData?.closed_by === 'user' ? 'oleh Anda' : 'oleh Admin'}. Terima kasih!
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-xs"
                      onClick={handleStartNewSession}
                    >
                      <i className="bi bi-plus-circle me-1.5"></i> Mulai Percakapan Baru
                    </button>
                  </div>
                ) : isSessionBlocked ? (
                  <div className="p-3 bg-danger-subtle border-top text-center shadow-xs">
                    <div className="alert alert-danger small mb-2 py-2 px-3 border-0 fw-semibold">
                      <i className="bi bi-shield-slash-fill me-1"></i>
                      Sesi ini diblokir karena terdeteksi pelanggaran atau aktivitas spam.
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary rounded-pill px-4 fw-semibold"
                      onClick={() => setIsOpen(false)}
                    >
                      Tutup Chat
                    </button>
                  </div>
                ) : (
                  /* Chat Input & WYSIWYG */
                  <div className="p-3 bg-white border-top border-slate-200">
                    {/* MS Teams Style Quoted Messages List Preview */}
                    {quotedMessages.length > 0 && (
                      <div className="ms-teams-quote-preview-container mb-2 p-1.5 bg-slate-50 border rounded-3" style={{ maxHeight: "110px", overflowY: "auto", backgroundColor: "#f8fafc" }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <small className="fw-bold text-primary" style={{ fontSize: "11px" }}>
                            <i className="bi bi-quote me-1"></i> Membalas {quotedMessages.length} Pesan (MS Teams Mode)
                          </small>
                          <button
                            type="button"
                            className="btn-close btn-close-xs"
                            onClick={() => setQuotedMessages([])}
                            title="Hapus Semua Kutipan"
                          ></button>
                        </div>

                        {quotedMessages.map((q) => (
                          <div key={q.id} className="p-1.5 mb-1 bg-white border-start border-3 border-primary rounded-end shadow-2xs position-relative">
                            <div className="d-flex align-items-center justify-content-between">
                              <small className="fw-semibold text-slate-700" style={{ fontSize: "11px" }}>
                                {q.sender_name} <span className="text-muted fw-normal">({new Date(q.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})</span>
                              </small>
                              <button
                                type="button"
                                className="btn-close btn-close-xs"
                                onClick={() => removeQuotedMessage(q.id)}
                              ></button>
                            </div>
                            <div className="small text-muted text-truncate" style={{ fontSize: "11px" }}>
                              {q.text_snippet}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Attachment Badge Preview + Caption Input */}
                    {attachment && (
                      <div className="bg-slate-100 p-2 mb-2 rounded-3 border shadow-2xs" style={{ backgroundColor: "#f1f5f9" }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="text-truncate fw-semibold text-slate-700 me-2" style={{ maxWidth: "220px", fontSize: "12px" }}>
                            <i className="bi bi-paperclip me-1 text-primary"></i> {attachment.name} ({formatFileSize(attachment.size)})
                          </span>
                          <button
                            type="button"
                            className="btn-close btn-close-xs"
                            onClick={() => { setAttachment(null); setAttachmentCaption(""); }}
                          ></button>
                        </div>
                        <input
                          type="text"
                          className="form-control form-control-sm border-slate-300"
                          placeholder="Tambah keterangan / caption file (opsional)..."
                          value={attachmentCaption}
                          onChange={(e) => setAttachmentCaption(e.target.value)}
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                    )}

                    <WysiwygEditor
                      value={messageHtml}
                      onChange={setMessageHtml}
                      onSend={handleSendMessage}
                      placeholder="Ketik pesan Anda..."
                    />

                    <div className="d-flex align-items-center justify-content-between mt-2.5">
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="d-none"
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-slate-600 border rounded-circle p-2 d-flex align-items-center justify-content-center"
                          style={{ width: "36px", height: "36px" }}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          title="Lampirkan File / Gambar (PNG, JPG, PDF, DOC)"
                        >
                          {uploadingFile ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="bi bi-paperclip fs-6"></i>
                          )}
                        </button>
                      </div>

                      {/* Kirim Button (Icon Envelope di kiri) */}
                      <button
                        type="button"
                        className="btn btn-sm px-4 py-2 text-white fw-semibold border-0 rounded-pill d-flex align-items-center gap-2 shadow-sm"
                        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
                        onClick={handleSendMessage}
                        disabled={sendingMessage || (!messageHtml.trim() && !attachment && quotedMessages.length === 0)}
                      >
                        {sendingMessage ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <i className="bi bi-envelope-fill fs-6"></i>
                            <span>Kirim</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* ── File Preview Modal Popup ── */}
      {previewFile && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 10500 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: "92%", maxWidth: "680px", maxHeight: "88vh" }}>
            <div className="p-3 text-white d-flex align-items-center justify-content-between" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
              <h6 className="mb-0 text-truncate text-white fw-bold" style={{ maxWidth: "80%" }}>
                <i className="bi bi-file-earmark-text me-2"></i> {previewFile.name}
              </h6>
              <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewFile(null)}></button>
            </div>
            <div className="p-3 bg-light overflow-y-auto d-flex align-items-center justify-content-center" style={{ minHeight: "320px", maxHeight: "calc(88vh - 120px)" }}>
              {isImageFile(previewFile.url) ? (
                <img src={previewFile.url} alt={previewFile.name} className="img-fluid rounded shadow-sm" style={{ maxHeight: "460px", objectFit: "contain" }} />
              ) : previewFile.url.endsWith(".pdf") ? (
                <iframe src={previewFile.url} title={previewFile.name} width="100%" height="450px" className="border rounded" />
              ) : (
                <div className="text-center p-4">
                  <i className="bi bi-file-earmark-word-fill text-primary display-3 mb-3"></i>
                  <h6 className="fw-bold">{previewFile.name}</h6>
                  <p className="text-muted small mb-3">File ini tidak mendukung pratinjau langsung di browser. Silakan unduh file untuk membukanya.</p>
                  <a href={previewFile.url} download className="btn btn-primary rounded-pill px-4">
                    <i className="bi bi-download me-1.5"></i> Download File ({formatFileSize(previewFile.size)})
                  </a>
                </div>
              )}
            </div>
            <div className="p-2.5 bg-white border-top text-end">
              <a href={previewFile.url} download className="btn btn-sm btn-primary rounded-pill me-2 px-3">
                <i className="bi bi-download me-1"></i> Download
              </a>
              <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setPreviewFile(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Floating Trigger Pill Button (Pojok Kanan Bawah) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn rounded-pill shadow-lg d-flex align-items-center gap-2 px-3.5 py-2.5 transition-all text-white border-0"
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
          fontWeight: 600,
          fontSize: "0.95rem",
          letterSpacing: "0.3px",
          height: "48px"
        }}
        aria-label="Open Live Chat"
      >
        <div className="position-relative d-flex align-items-center justify-content-center">
          <i className={`bi ${isOpen ? "bi-x-lg fs-5" : "bi-chat-dots-fill fs-5"}`}></i>
        </div>
        <span>{isOpen ? "Tutup Chat" : "Live Chat"}</span>

        {/* Unread Counter Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="badge rounded-pill bg-danger border border-light ms-1 px-2 py-1">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
