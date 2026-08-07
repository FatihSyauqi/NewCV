"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WysiwygEditor from "@/app/components/WysiwygEditor";
import { sanitizeHtml } from "@/lib/sanitizer";

export default function LiveChatClient() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Message compose state, attachment caption & MS Teams Quoted Messages
  const [messageHtml, setMessageHtml] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [quotedMessages, setQuotedMessages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const isUserScrolledUpRef = useRef(false);
  const prevMsgLengthRef = useRef(0);

  const prevUserMsgCountRef = useRef(-1);

  // Play audio notification tone (Crisp Slack/WhatsApp style crystal chime)
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

  // Unlock AudioContext on first click/touch
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

  // Fetch all chat sessions periodically (also acts as Admin Online Heartbeat)
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);

      const totalUnread = data.totalUnread || 0;
      if (prevUnreadRef.current !== undefined && totalUnread > prevUnreadRef.current) {
        playNotificationSound();
      }
      prevUnreadRef.current = totalUnread;

      if (!activeSessionId && data.sessions && data.sessions.length > 0) {
        setActiveSessionId(data.sessions[0].id);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, playNotificationSound]);

  // Fetch messages for active session & trigger audio on new incoming user message
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/chat/messages?session_id=${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const newMsgs = data.messages || [];
      setMessages(newMsgs);

      const userMsgs = newMsgs.filter(m => m.sender_type === 'user');
      const currentUserCount = userMsgs.length;

      if (prevUserMsgCountRef.current !== -1 && currentUserCount > prevUserMsgCountRef.current) {
        playNotificationSound();
      }
      prevUserMsgCountRef.current = currentUserCount;
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  }, [playNotificationSound]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
      const interval = setInterval(() => fetchMessages(activeSessionId), 3000);
      return () => clearInterval(interval);
    }
  }, [activeSessionId, fetchMessages]);

  // Track scroll position in chat body
  const handleChatScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 80;
  };

  // Always auto-scroll to bottom whenever a new chat message arrives
  useEffect(() => {
    const hasNewMsg = messages.length > prevMsgLengthRef.current;
    prevMsgLengthRef.current = messages.length;

    if (hasNewMsg) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // When active session changes, reset scroll to bottom once
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }, [activeSessionId]);

  // Add message to MS Teams Quote Reply list
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

  // Active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.phone_number.includes(searchFilter) ||
      (s.ip_address || "").includes(searchFilter);
    const matchesStatus =
      statusFilter === "all" ||
      s.status === statusFilter ||
      (statusFilter === "closed" && s.status === "closed") ||
      (statusFilter === "blocked" && s.status === "blocked");
    return matchesSearch && matchesStatus;
  });

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

    setUploading(true);
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
      setUploading(false);
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
            <div style="color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;">${q.text_snippet}</div>
          </blockquote>`
      )
      .join("");
  };

  // Send Admin Message
  const handleSendMessage = async () => {
    if (!activeSessionId) return;
    if (!messageHtml.trim() && !attachment && quotedMessages.length === 0) return;
    if (sending) return;

    setSending(true);
    try {
      const quoteHtml = buildQuotedHtml();
      let contentBody = messageHtml || "";
      if (attachmentCaption.trim()) {
        contentBody += `<div class="attachment-caption fw-semibold mb-1" style="color: #1e293b !important; font-weight: 600; font-size: 0.95rem; font-style: normal;"><i class="bi bi-card-text me-1 text-primary"></i> ${attachmentCaption.trim()}</div>`;
      }
      const finalMessageHtml = quoteHtml + contentBody;

      const payload = {
        session_id: activeSessionId,
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
      if (!res.ok) throw new Error(data.error || "Gagal mengirim balasan");

      setMessageHtml("");
      setAttachment(null);
      setAttachmentCaption("");
      setQuotedMessages([]);

      isUserScrolledUpRef.current = false;

      fetchMessages(activeSessionId);
      fetchSessions();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  // Toggle Session Status (Active / Closed)
  const handleToggleStatus = async () => {
    if (!activeSession) return;
    const newStatus = activeSession.status === "active" ? "closed" : "active";
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id, status: newStatus })
      });
      if (res.ok) {
        fetchSessions();
        fetchMessages(activeSession.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Admin Block User (IP + Email + Phone Number)
  const handleBlockUser = async () => {
    if (!activeSession) return;
    if (!confirm(`Apakah Anda yakin ingin memblokir Pengunjung Ini (${activeSession.full_name})?\n\nBlokir mencakup:\n- IP: ${activeSession.ip_address || "Unknown"}\n- Email: ${activeSession.email}\n- No HP: ${activeSession.phone_number}`)) {
      return;
    }

    try {
      const res = await fetch("/api/chat/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id, action: "block_user" })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSessions();
        fetchMessages(activeSession.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Admin Unblock User
  const handleUnblockUser = async () => {
    if (!activeSession) return;
    if (!confirm(`Apakah Anda yakin ingin membuka kembali pemblokiran pengguna ${activeSession.full_name}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/chat/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id, action: "unblock_user" })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSessions();
        fetchMessages(activeSession.id);
      }
    } catch (err) {
      alert(err.message);
    }
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

  const formatWaUrl = (phone) => {
    let clean = (phone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);
    return `https://wa.me/${clean}`;
  };

  const getAttachmentUrl = (url) => {
    if (!url) return "#";
    return url;
  };

  return (
    <div className="container-fluid p-0">
      {/* Main Chat Shell Layout - Flush to Top */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: "calc(100vh - 70px)", minHeight: "650px" }}>
        <div className="row g-0 h-100">
          {/* ── LEFT SIDEBAR: SESSION LIST ── */}
          <div className="col-12 col-md-4 col-lg-3 border-end bg-light d-flex flex-column h-100">
            {/* Search & Filter */}
            <div className="p-3 border-bottom bg-white">
              <div className="input-group input-group-sm mb-2">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Cari nama, email, hp, IP..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>

              <div className="btn-group btn-group-sm w-100">
                <button
                  type="button"
                  className={`btn ${statusFilter === "all" ? "btn-dark fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("all")}
                >
                  Semua ({sessions.length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "active" ? "btn-success fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("active")}
                >
                  Aktif ({sessions.filter(s => s.status === 'active').length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "closed" ? "btn-secondary fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("closed")}
                >
                  Tutup ({sessions.filter(s => s.status === 'closed').length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "blocked" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
                  onClick={() => setStatusFilter("blocked")}
                >
                  Blokir ({sessions.filter(s => s.status === 'blocked').length})
                </button>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-grow-1 overflow-y-auto">
              {loading ? (
                <div className="text-center p-4 text-muted">
                  <span className="spinner-border spinner-border-sm me-2"></span> Memuat pesan...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center p-4 text-muted small">
                  Tidak ada sesi chat ditemukan.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isUnread = session.unread_admin > 0;

                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`p-3 border-bottom position-relative cursor-pointer transition-all ${
                        isActive ? "bg-white border-start border-primary border-4 shadow-xs" : "hover-bg-white"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className={`mb-0 text-truncate ${isUnread ? "fw-bold text-dark" : "fw-semibold text-dark-emphasis"}`} style={{ maxWidth: "150px" }}>
                          {session.full_name}
                        </h6>
                        <small className="text-muted" style={{ fontSize: "11px" }}>
                          {new Date(session.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>

                      <p className="text-muted small mb-1 text-truncate" style={{ fontSize: "12px" }}>
                        {session.initial_message || session.email}
                      </p>

                      <div className="d-flex align-items-center justify-content-between">
                        <span className={`badge ${
                          session.status === 'active' ? 'bg-success-subtle text-success' :
                          session.status === 'blocked' ? 'bg-danger-subtle text-danger' :
                          'bg-secondary-subtle text-secondary'
                        }`} style={{ fontSize: "10px" }}>
                          {session.status === 'active' ? 'Aktif' :
                           session.status === 'blocked' ? 'Diblokir' :
                           session.closed_by === 'user' ? 'Tutup (User)' : 'Tutup (Admin)'}
                        </span>

                        {isUnread && (
                          <span className="badge rounded-pill bg-danger">
                            {session.unread_admin} baru
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT MAIN PANEL: CHAT WINDOW ── */}
          <div
            className="col-12 col-md-8 col-lg-9 d-flex flex-column h-100 bg-white position-relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* ── DRAG & DROP OVERLAY ── */}
            {isDraggingFile && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-90 d-flex flex-column align-items-center justify-content-center text-white p-3 shadow-lg"
                style={{ zIndex: 10000, backdropFilter: "blur(4px)", pointerEvents: "none" }}
              >
                <i className="bi bi-cloud-arrow-up-fill display-3 mb-2 animate-bounce"></i>
                <h4 className="fw-bold mb-1">Lepaskan File di Sini</h4>
                <p className="small mb-0 text-white-50">Maksimal 2 MB (Gambar PNG/JPG/WEBP, PDF, Word)</p>
              </div>
            )}
            {activeSession ? (
              <>
                {/* Header Soft Blue dengan Teks Kontras Tinggi */}
                <div
                  className="p-3 text-white border-bottom d-flex align-items-center justify-content-between shadow-xs"
                  style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center shadow-xs" style={{ width: "42px", height: "42px" }}>
                      {activeSession.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h2 className="h6 fw-bold mb-0 text-white">{activeSession.full_name}</h2>
                        {activeSession.ip_address && (
                          <span className="badge bg-white text-primary font-monospace" style={{ fontSize: "10px" }}>
                            IP: {activeSession.ip_address}
                          </span>
                        )}
                      </div>
                      <div className="d-flex flex-wrap align-items-center gap-2 small text-white fw-medium" style={{ opacity: 0.95 }}>
                        <span><i className="bi bi-envelope me-1"></i>{activeSession.email}</span>
                        <span>•</span>
                        <span><i className="bi bi-telephone me-1"></i>{activeSession.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <a
                      href={formatWaUrl(activeSession.phone_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-success d-flex align-items-center gap-1 fw-semibold shadow-xs"
                    >
                      <i className="bi bi-whatsapp"></i>
                      <span className="d-none d-sm-inline">Chat WA</span>
                    </a>

                    {activeSession.status === 'blocked' ? (
                      <button
                        type="button"
                        onClick={handleUnblockUser}
                        className="btn btn-sm btn-warning text-dark fw-bold"
                      >
                        <i className="bi bi-unlock-fill me-1"></i> Buka Blokir
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleToggleStatus}
                          className={`btn btn-sm ${activeSession.status === 'active' ? 'btn-light text-dark fw-bold' : 'btn-outline-light'}`}
                        >
                          {activeSession.status === 'active' ? 'Tutup Sesi' : 'Buka Kembali'}
                        </button>
                        <button
                          type="button"
                          onClick={handleBlockUser}
                          className="btn btn-sm btn-danger text-white fw-semibold"
                          title="Blokir User (IP, Email, & No. HP Pengunjung Ini)"
                        >
                          <i className="bi bi-shield-slash-fill me-1"></i> Blokir User
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages Body (Tech Doodles Background) */}
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
                  {messages.map((msg) => {
                    const isAdmin = msg.sender_type === "admin";
                    const cleanHtml = sanitizeHtml(msg.message_html);
                    const fileUrl = getAttachmentUrl(msg.attachment_url);

                    return (
                      <div
                        key={msg.id}
                        className={`d-flex flex-column mb-3 position-relative ${isAdmin ? "align-items-end" : "align-items-start"}`}
                      >
                        <div className="d-flex align-items-center gap-1.5 mb-1 px-1">
                          <small className="fw-semibold text-slate-700" style={{ fontSize: "11px", color: "#475569" }}>
                            {msg.sender_name}
                          </small>
                          <small className="text-slate-500" style={{ fontSize: "10px", color: "#64748b" }}>
                            • {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                          {/* Reply Text Button */}
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
                        </div>

                        {/* White Background Bubble dengan Font Warna Hitam */}
                        <div
                          className="p-3 shadow-xs bg-white text-slate-800 border"
                          style={{
                            maxWidth: "85%",
                            fontSize: "0.95rem",
                            lineHeight: "1.5",
                            background: "#ffffff",
                            color: "#1e293b",
                            borderColor: "#e2e8f0",
                            borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                          }}
                        >
                          {/* Rich Text Sanitized Content */}
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
                                    src={fileUrl}
                                    alt={msg.attachment_name || "Attachment"}
                                    className="img-fluid rounded border shadow-xs cursor-pointer"
                                    style={{ maxHeight: "220px", objectFit: "cover" }}
                                    onClick={() => setPreviewFile({ url: fileUrl, name: msg.attachment_name || "Gambar", size: msg.attachment_size })}
                                    title="Klik untuk memperbesar gambar"
                                  />
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-3 bg-slate-50 text-slate-800 border shadow-2xs">
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    <i className="bi bi-file-earmark-text-fill fs-4 text-primary"></i>
                                    <div className="text-truncate" style={{ maxWidth: "200px" }}>
                                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "12px" }}>{msg.attachment_name || "File Document"}</div>
                                      <small className="text-muted fw-semibold" style={{ fontSize: "10px" }}>{formatFileSize(msg.attachment_size)}</small>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-1.5">
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-primary fw-semibold rounded-pill py-0.5 px-2.5"
                                      style={{ fontSize: "11px" }}
                                      onClick={() => setPreviewFile({ url: fileUrl, name: msg.attachment_name || "Dokumen", size: msg.attachment_size })}
                                    >
                                      <i className="bi bi-eye-fill me-1"></i> Preview
                                    </button>
                                    <a
                                      href={fileUrl}
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
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="p-3 bg-white border-top">
                  {/* MS Teams Quoted Messages List Preview */}
                  {quotedMessages.length > 0 && (
                    <div className="ms-teams-quote-preview-container mb-2 p-2 bg-slate-50 border rounded-3" style={{ maxHeight: "120px", overflowY: "auto", backgroundColor: "#f8fafc" }}>
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

                  {/* Attachment Preview Badge + Caption Input */}
                  {attachment && (
                    <div className="bg-slate-100 p-2 mb-2 rounded-3 border shadow-2xs" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="text-truncate fw-semibold text-slate-700 me-2" style={{ maxWidth: "260px", fontSize: "12px" }}>
                          <i className="bi bi-paperclip me-1 text-primary"></i> {attachment.name} ({formatFileSize(attachment.size)})
                        </span>
                        <button
                          type="button"
                          className="btn-close btn-close-xs ms-2"
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
                    placeholder="Ketik balasan Anda ke pengunjung..."
                  />

                  <div className="d-flex align-items-center justify-content-between mt-2">
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
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <i className="bi bi-paperclip"></i>
                            <span>Lampirkan Berkas</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Kirim Button (Icon Envelope di kiri) */}
                    <button
                      type="button"
                      className="btn px-4 py-2 text-white fw-semibold border-0 rounded-3 d-flex align-items-center gap-2 shadow-xs"
                      style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
                      onClick={handleSendMessage}
                      disabled={sending || (!messageHtml.trim() && !attachment && quotedMessages.length === 0)}
                    >
                      {sending ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-envelope-fill fs-6"></i>
                          <span>Kirim Balasan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-4">
                <i className="bi bi-chat-left-dots text-secondary fs-1 mb-2"></i>
                <p className="mb-0">Pilih salah satu sesi obrolan di sebelah kiri untuk melihat pesan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── File Preview Modal Popup ── */}
      {previewFile && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 10500 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: "92%", maxWidth: "700px", maxHeight: "88vh" }}>
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
    </div>
  );
}
