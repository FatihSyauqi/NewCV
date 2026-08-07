"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WysiwygEditor from "@/app/components/WysiwygEditor";
import { sanitizeHtml } from "@/lib/sanitizer";

const AVATAR_COLORS = [
  "#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777",
  "#008069", "#0284c7", "#4f46e5", "#ca8a04", "#e11d48"
];

const getAvatarColor = (name) => {
  if (!name) return "#008069";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getLastMessagePreview = (session) => {
  if (session.last_message_html) {
    // Strip nested blockquotes (quotes) first, then strip remaining HTML tags
    const withoutBlockquotes = (session.last_message_html || "").replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, "");
    const cleanText = withoutBlockquotes.replace(/<[^>]+>/g, "").trim();
    if (cleanText) return cleanText;
  }
  if (session.last_attachment_name) {
    return `📎 ${session.last_attachment_name}`;
  }
  return session.initial_message || session.email;
};

export default function LiveChatClient() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Responsiveness & Dropdown Action state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Dynamic API URL Helper (Handles basePath '/AdminFSyauqi' dynamically in dev and prod)
  const getApiUrl = (path) => {
    if (typeof window !== "undefined") {
      const isBaseAdmin = window.location.pathname.includes("/AdminFSyauqi");
      if (isBaseAdmin && !path.startsWith("/AdminFSyauqi")) {
        return `/AdminFSyauqi${path}`;
      }
    }
    return path;
  };

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
  const lastTypingSignalRef = useRef(0);

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
      const res = await fetch(getApiUrl("/api/chat/sessions"));
      const data = await res.json();
      if (Array.isArray(data.sessions)) {
        setSessions(data.sessions);

        const totalUnread = data.totalUnread || 0;
        if (prevUnreadRef.current !== undefined && totalUnread > prevUnreadRef.current) {
          playNotificationSound();
        }
        prevUnreadRef.current = totalUnread;

        if (!activeSessionId && data.sessions.length > 0) {
          setActiveSessionId(data.sessions[0].id);
        }
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
      const res = await fetch(getApiUrl(`/api/chat/messages?session_id=${sessionId}`));
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
    // Fallback polling — 15s (WebSocket handles real-time; this is safety net)
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
      // Fallback polling — 15s
      const interval = setInterval(() => fetchMessages(activeSessionId), 15000);
      return () => clearInterval(interval);
    }
  }, [activeSessionId, fetchMessages]);

  // ── WebSocket connection for real-time push notifications ──────────────
  const wsRef = useRef(null);
  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/ws-admin`);
        wsRef.current = ws;

        ws.onopen = () => {
          // Subscribe current session immediately after connect
          if (activeSessionIdRef.current) {
            ws.send(JSON.stringify({ type: "subscribe_session", sessionId: activeSessionIdRef.current }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "sessions_update") {
              fetchSessions();
            } else if (msg.type === "messages_update") {
              const sid = msg.sessionId || activeSessionIdRef.current;
              if (sid) fetchMessages(sid);
            }
            // ping — no action needed
          } catch (_) {}
        };

        ws.onclose = () => {
          if (mounted) {
            // Auto-reconnect after 5 seconds on unexpected close
            reconnectTimer = setTimeout(connect, 5000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        // WebSocket not available (SSR or blocked) — fall back to polling only
        console.warn("[ws] WebSocket not available, using polling fallback");
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [fetchSessions, fetchMessages]);

  // Re-subscribe whenever active session changes
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && activeSessionId) {
      ws.send(JSON.stringify({ type: "subscribe_session", sessionId: activeSessionId }));
    }
  }, [activeSessionId]);

  // Alert confirmation when trying to close tab while writing a message
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const cleanText = (messageHtml || "").replace(/<[^>]+>/g, "").trim();
      if (cleanText.length > 0) {
        e.preventDefault();
        e.returnValue = "Pesan Anda belum terkirim. Apakah Anda yakin ingin meninggalkan halaman?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [messageHtml]);

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

  // Admin typing signal heartbeat
  const handleAdminTypingSignal = () => {
    if (!activeSessionId) return;
    const now = Date.now();
    if (now - lastTypingSignalRef.current > 2000) {
      lastTypingSignalRef.current = now;
      fetch(getApiUrl("/api/chat/sessions"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSessionId, action: "typing" })
      }).catch(() => { });
    }
  };

  // Add message to MS Teams Quote Reply list
  const handleQuoteMessage = (msg) => {
    if (quotedMessages.some((q) => q.id === msg.id)) return;
    // Strip nested blockquotes (and their inner text) first, then strip remaining HTML tags
    const withoutBlockquotes = (msg.message_html || "").replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, "");
    const rawText = withoutBlockquotes.replace(/<[^>]+>/g, "").trim();
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
      (statusFilter === "unread" && s.unread_admin > 0) ||
      (statusFilter === "active" && s.status === "active") ||
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
      const res = await fetch(getApiUrl("/api/chat/upload"), {
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
          `<blockquote class="ms-teams-quote-block" style="border-left: 3px solid #3b82f6; background-color: #f8fafc; color: #1e293b; padding: 8px 12px 8px 14px; margin: 0 0 8px 0; border-radius: 4px; font-size: 0.85rem;">
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

      // Optimistic UI update: Push temp message with sending = true
      const tempId = "temp_" + Date.now();
      const tempMsg = {
        id: tempId,
        session_id: activeSessionId,
        sender_type: "admin",
        sender_name: "Fatih Syauqi (Admin)",
        message_html: finalMessageHtml,
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_size: attachment?.size || null,
        is_read: 0,
        sending: true,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempMsg]);

      const payload = {
        session_id: activeSessionId,
        message_html: finalMessageHtml,
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_size: attachment?.size || null
      };

      const res = await fetch(getApiUrl("/api/chat/messages"), {
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
      const res = await fetch(getApiUrl("/api/chat/sessions"), {
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
      const res = await fetch(getApiUrl("/api/chat/sessions"), {
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
      const res = await fetch(getApiUrl("/api/chat/sessions"), {
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

  // Admin Action: Delete single chat session & its attachment files
  const handleDeleteSession = async () => {
    if (!activeSession) return;
    if (!confirm(`⚠️ HAPUS SESI CHAT PERMANEN:\nApakah Anda yakin ingin menghapus sesi chat (${activeSession.full_name}) beserta SELURUH file attachment terunggah secara PERMANEN?\n\nTindakan ini TIDAK DAPAT DIBATALKAN!`)) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/chat/sessions?session_id=${activeSession.id}`), {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setActiveSessionId(null);
        setMessages([]);
        fetchSessions();
      } else {
        alert(data.error || "Gagal menghapus sesi chat");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Admin Action: Delete ALL chat sessions & ALL upload files physically
  const handleDeleteAllSessions = async () => {
    if (!confirm(`⚠️ PERINGATAN BAHAYA!\n\nApakah Anda yakin ingin MENGHAPUS SEMUA PERCAKAPAN CHAT beserta SELURUH BERKAS FILE ATTACHMENT DI FOLDER secara PERMANEN?\n\nFolder uploads/chat akan dibersihkan total walaupun file tersebut tidak ada di database.\n\nTindakan ini TIDAK DAPAT DIBATALKAN!`)) {
      return;
    }

    try {
      const res = await fetch(getApiUrl("/api/chat/sessions?action=delete_all"), {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setActiveSessionId(null);
        setMessages([]);
        fetchSessions();
      } else {
        alert(data.error || "Gagal menghapus seluruh chat");
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
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={{ height: "calc(100vh - 70px)", minHeight: "650px" }}>
        <div className="row g-0 h-100">
          {/* ── LEFT SIDEBAR: SESSION LIST (Exact WhatsApp Web Desktop Layout) ── */}
          <div
            className={`col-12 col-md-4 col-lg-3 border-end flex-column h-100 bg-white ${showMobileSidebar
                ? "d-flex position-absolute top-0 start-0 w-100 h-100 shadow-lg"
                : "d-none d-md-flex"
              }`}
            style={{ zIndex: showMobileSidebar ? 1050 : 1 }}
          >
            {/* Header Sidebar Exact WhatsApp Web Layout */}
            <div className="p-3 border-bottom bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <h4 className="fw-bold mb-0" style={{ color: "#2563eb", fontSize: "1.35rem", letterSpacing: "-0.5px" }}>
                    Live Chat
                  </h4>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {/* Three dots WhatsApp Header Menu */}
                  <div className="dropdown position-relative">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-secondary p-1 border-0 shadow-none"
                      onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                      title="Menu Aksi Sesi"
                    >
                      <i className="bi bi-three-dots-vertical fs-5" style={{ color: "#54656f" }}></i>
                    </button>
                    {showHeaderMenu && (
                      <div
                        className="dropdown-menu dropdown-menu-end show position-absolute end-0 mt-1 shadow-md rounded-3 border-0 py-1.5 overflow-hidden"
                        style={{ zIndex: 1060, minWidth: "180px", background: "#ffffff" }}
                      >
                        <button
                          type="button"
                          className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-danger fw-semibold"
                          onClick={() => { setShowHeaderMenu(false); handleDeleteAllSessions(); }}
                        >
                          <i className="bi bi-trash3-fill fs-6 text-danger"></i>
                          <span>Hapus Semua Chat</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-light border text-muted px-2 py-0.5 d-md-none"
                    onClick={() => setShowMobileSidebar(false)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              {/* Search Bar Exact WhatsApp Web Style */}
              <div className="input-group my-2">
                <span className="input-group-text border-0 ps-3 rounded-start-3" style={{ background: "#f0f2f5", color: "#54656f" }}>
                  <i className="bi bi-search" style={{ fontSize: "14px" }}></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 rounded-end-3 shadow-none"
                  placeholder="Cari atau mulai obrolan baru"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ background: "#f0f2f5", fontSize: "13.5px", color: "#111b21" }}
                />
              </div>

              {/* Filter Pills Chips Row - Horizontally Scrollable via mouse wheel & touch drag */}
              <div
                className="d-flex align-items-center gap-1.5 pt-1 pb-1 flex-nowrap"
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                style={{
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#cbd5e1 transparent"
                }}
              >
                <button
                  type="button"
                  className="btn btn-xs rounded-pill px-3 py-1.5 fw-semibold text-nowrap flex-shrink-0 transition-all border-0 shadow-none"
                  style={{
                    backgroundColor: statusFilter === "all" ? "#dbeafe" : "#f0f2f5",
                    color: statusFilter === "all" ? "#1d4ed8" : "#54656f",
                    fontSize: "12.5px"
                  }}
                  onClick={() => setStatusFilter("all")}
                >
                  Semua ({sessions.length})
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill px-3 py-1.5 fw-semibold text-nowrap flex-shrink-0 transition-all border-0 shadow-none"
                  style={{
                    backgroundColor: statusFilter === "unread" ? "#dbeafe" : "#f0f2f5",
                    color: statusFilter === "unread" ? "#1d4ed8" : "#54656f",
                    fontSize: "12.5px"
                  }}
                  onClick={() => setStatusFilter("unread")}
                >
                  Belum Dibaca ({sessions.filter(s => s.unread_admin > 0).length})
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill px-3 py-1.5 fw-semibold text-nowrap flex-shrink-0 transition-all border-0 shadow-none"
                  style={{
                    backgroundColor: statusFilter === "active" ? "#dbeafe" : "#f0f2f5",
                    color: statusFilter === "active" ? "#1d4ed8" : "#54656f",
                    fontSize: "12.5px"
                  }}
                  onClick={() => setStatusFilter("active")}
                >
                  Aktif ({sessions.filter(s => s.status === 'active').length})
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill px-3 py-1.5 fw-semibold text-nowrap flex-shrink-0 transition-all border-0 shadow-none"
                  style={{
                    backgroundColor: statusFilter === "closed" ? "#dbeafe" : "#f0f2f5",
                    color: statusFilter === "closed" ? "#1d4ed8" : "#54656f",
                    fontSize: "12.5px"
                  }}
                  onClick={() => setStatusFilter("closed")}
                >
                  Tutup ({sessions.filter(s => s.status === 'closed').length})
                </button>
                <button
                  type="button"
                  className="btn btn-xs rounded-pill px-3 py-1.5 fw-semibold text-nowrap flex-shrink-0 transition-all border-0 shadow-none"
                  style={{
                    backgroundColor: statusFilter === "blocked" ? "#fee2e2" : "#f0f2f5",
                    color: statusFilter === "blocked" ? "#dc2626" : "#54656f",
                    fontSize: "12.5px"
                  }}
                  onClick={() => setStatusFilter("blocked")}
                >
                  Blokir ({sessions.filter(s => s.status === 'blocked').length})
                </button>
              </div>
            </div>

            {/* Sessions List Exact WhatsApp Web Style */}
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
                  const avatarColor = getAvatarColor(session.full_name);

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setShowMobileSidebar(false);
                      }}
                      className="d-flex align-items-center cursor-pointer transition-all border-bottom"
                      style={{
                        cursor: "pointer",
                        backgroundColor: isActive ? "#f0f2f5" : "#ffffff",
                        padding: "14px 16px",
                        minHeight: "72px",
                        borderColor: "#e9edef"
                      }}
                    >
                      {/* WhatsApp 49px Circle Avatar */}
                      <div className="position-relative flex-shrink-0 me-3">
                        <div
                          className="rounded-circle fw-bold text-white d-flex align-items-center justify-content-center shadow-2xs"
                          style={{
                            width: "49px",
                            height: "49px",
                            fontSize: "18px",
                            backgroundColor: avatarColor
                          }}
                        >
                          {session.full_name.charAt(0).toUpperCase()}
                        </div>
                        {!!session.is_user_typing && (
                          <span
                            className="position-absolute bottom-0 end-0 spinner-grow spinner-grow-sm text-success border border-2 border-white rounded-circle"
                            style={{ width: "12px", height: "12px" }}
                            title="Pengunjung sedang mengetik..."
                          ></span>
                        )}
                      </div>

                      {/* Item Content */}
                      <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-center">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <h6
                            className="mb-0 text-truncate"
                            style={{
                              fontSize: "16px",
                              color: "#111b21",
                              fontWeight: isUnread ? "600" : "500"
                            }}
                          >
                            {session.full_name}
                          </h6>
                          <small
                            className="ms-2 flex-shrink-0"
                            style={{
                              fontSize: "12px",
                              color: isUnread ? "#25D366" : "#667781",
                              fontWeight: isUnread ? "600" : "normal"
                            }}
                          >
                            {new Date(session.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </div>

                        <div className="d-flex align-items-center justify-content-between">
                          <p
                            className="mb-0 text-truncate"
                            style={{
                              fontSize: "13.5px",
                              color: isUnread ? "#111b21" : "#667781",
                              fontWeight: isUnread ? "500" : "normal",
                              maxWidth: "180px"
                            }}
                          >
                            {getLastMessagePreview(session)}
                          </p>

                          <div className="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
                            {isUnread ? (
                              <span
                                className="badge rounded-circle bg-success text-white d-flex align-items-center justify-content-center shadow-xs"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  fontSize: "11px",
                                  backgroundColor: "#25D366"
                                }}
                              >
                                {session.unread_admin}
                              </span>
                            ) : session.status === 'blocked' ? (
                              <span className="badge bg-danger-subtle text-danger" style={{ fontSize: "10px" }}>Diblokir</span>
                            ) : session.status === 'closed' ? (
                              <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "10px" }}>Tutup</span>
                            ) : null}
                          </div>
                        </div>
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
                    {/* Mobile Sesi Toggle Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light text-primary fw-bold d-md-none shadow-xs d-flex align-items-center gap-1 py-1 px-2"
                      onClick={() => setShowMobileSidebar(true)}
                      title="Lihat Daftar Sesi Chat"
                    >
                      <i className="bi bi-chat-left-text-fill"></i>
                      <span>Sesi</span>
                    </button>

                    <div className="bg-white text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center shadow-xs flex-shrink-0" style={{ width: "42px", height: "42px" }}>
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

                  {/* Header Action Dropdown Menu (Aksi) */}
                  <div className="dropdown position-relative">
                    <button
                      type="button"
                      className="btn btn-sm btn-light text-primary fw-bold dropdown-toggle d-flex align-items-center gap-1.5 shadow-xs px-3 py-1.5 rounded-3 border-0"
                      onClick={() => setShowActionDropdown(!showActionDropdown)}
                      style={{ backgroundColor: "#ffffff", color: "#2563eb" }}
                    >
                      <i className="bi bi-gear-fill"></i>
                      <span>Aksi</span>
                    </button>

                    {showActionDropdown && (
                      <div
                        className="dropdown-menu dropdown-menu-end show position-absolute end-0 mt-2 shadow-lg rounded-3 border-0 py-1.5 overflow-hidden"
                        style={{ zIndex: 1060, minWidth: "200px", background: "#ffffff" }}
                      >
                        <a
                          href={formatWaUrl(activeSession.phone_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-success fw-semibold"
                          onClick={() => setShowActionDropdown(false)}
                        >
                          <i className="bi bi-whatsapp fs-6 text-success"></i>
                          <span>Chat WhatsApp</span>
                        </a>

                        {activeSession.status === 'blocked' ? (
                          <button
                            type="button"
                            onClick={() => { setShowActionDropdown(false); handleUnblockUser(); }}
                            className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-warning fw-bold"
                          >
                            <i className="bi bi-unlock-fill fs-6 text-warning"></i>
                            <span>Buka Pemblokiran</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => { setShowActionDropdown(false); handleToggleStatus(); }}
                              className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-dark fw-medium"
                            >
                              <i className={`bi ${activeSession.status === 'active' ? 'bi-x-circle-fill text-secondary' : 'bi-check-circle-fill text-success'} fs-6`}></i>
                              <span>{activeSession.status === 'active' ? 'Tutup Sesi Chat' : 'Buka Kembali Sesi'}</span>
                            </button>
                            <div className="dropdown-divider my-1"></div>
                            <button
                              type="button"
                              onClick={() => { setShowActionDropdown(false); handleBlockUser(); }}
                              className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-danger fw-semibold"
                            >
                              <i className="bi bi-shield-slash-fill fs-6 text-danger"></i>
                              <span>Blokir Pengunjung</span>
                            </button>
                          </>
                        )}
                        <div className="dropdown-divider my-1"></div>
                        <button
                          type="button"
                          onClick={() => { setShowActionDropdown(false); handleDeleteSession(); }}
                          className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-danger fw-bold"
                        >
                          <i className="bi bi-trash-fill fs-6 text-danger"></i>
                          <span>Hapus Sesi Chat Ini</span>
                        </button>
                      </div>
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
                        <div className="d-flex align-items-center gap-2 mb-1 px-1">
                          <small className="fw-semibold text-slate-700" style={{ fontSize: "11px", color: "#475569" }}>
                            {msg.sender_name}
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

                        {/* WhatsApp Style Bubble with Font Warna Hitam */}
                        <div
                          className="shadow-xs border"
                          style={{
                            maxWidth: "85%",
                            fontSize: "0.95rem",
                            lineHeight: "1.5",
                            background: isAdmin ? "#d9fdd3" : "#ffffff",
                            color: "#1e293b",
                            borderColor: isAdmin ? "#d9fdd3" : "#e2e8f0",
                            borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            padding: "6px 10px 6px 12px",
                            minWidth: "85px",
                            display: "inline-block"
                          }}
                        >
                          {/* Inject CSS override to display editor paragraphs inline inside chat bubbles */}
                          <style dangerouslySetInnerHTML={{ __html: `
                            .message-rich-content, .message-rich-content p {
                              display: inline !important;
                              margin: 0 !important;
                            }
                          `}} />

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
                            <div className="mt-2 pt-2 border-top border-slate-200 d-block" style={{ display: "block" }}>
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

                          {/* Bottom Right timestamp & flags */}
                          <span
                            className="d-inline-flex align-items-center gap-1 text-muted"
                            style={{
                              fontSize: "10px",
                              color: "#667781",
                              userSelect: "none",
                              marginLeft: "8px",
                              marginTop: "4px",
                              float: "right",
                              verticalAlign: "bottom"
                            }}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isAdmin && (
                              <span className="d-inline-flex align-items-center" style={{ lineHeight: "1" }}>
                                {msg.sending ? (
                                  <i className="bi bi-clock text-muted" style={{ fontSize: "9px" }} title="Menunggu terkirim..."></i>
                                ) : msg.is_read ? (
                                  <i className="bi bi-check2-all text-success fw-bold" style={{ fontSize: "13px", color: "#22c55e" }} title="Dibaca"></i>
                                ) : (
                                  <i className="bi bi-check2 text-success fw-bold" style={{ fontSize: "13px", color: "#22c55e" }} title="Terkirim"></i>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator Balloon when Visitor is typing */}
                  {!!activeSession?.is_user_typing && (
                    <div className="d-flex flex-column align-items-start mb-3 animate-fade-in">
                      <small className="fw-semibold text-slate-500 mb-1 px-1" style={{ fontSize: "10px", color: "#64748b" }}>
                        {activeSession.full_name}
                      </small>
                      <div
                        className="p-2.5 px-3 bg-white text-slate-700 border shadow-xs d-flex align-items-center gap-2"
                        style={{
                          borderRadius: "18px 18px 18px 4px",
                          fontSize: "0.85rem",
                          background: "#ffffff",
                          borderColor: "#e2e8f0"
                        }}
                      >
                        <span className="fst-italic text-muted">sedang mengetik</span>
                        <span className="d-inline-flex align-items-center gap-1 ms-1">
                          <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "6px", height: "6px", animationDuration: "0.6s" }}></span>
                          <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "6px", height: "6px", animationDuration: "0.8s" }}></span>
                          <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "6px", height: "6px", animationDuration: "1s" }}></span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="p-3 bg-white border-top">
                  {/* MS Teams Quoted Messages List Preview */}
                  {quotedMessages.length > 0 && (
                    <div className="ms-teams-quote-preview-container mb-2 p-2 bg-slate-50 border rounded-3" style={{ maxHeight: "120px", overflowY: "auto", backgroundColor: "#f8fafc" }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <small className="fw-bold text-primary" style={{ fontSize: "11px" }}>
                          <i className="bi bi-quote me-1"></i> Membalas {quotedMessages.length} Pesan
                        </small>
                        <button
                          type="button"
                          className="btn-close btn-close-xs"
                          onClick={() => setQuotedMessages([])}
                          title="Hapus Semua Kutipan"
                        ></button>
                      </div>

                      {quotedMessages.map((q) => (
                        <div key={q.id} className="py-1.5 ps-3 pe-2 mb-1 bg-white border-start border-3 border-primary rounded-end shadow-2xs position-relative">
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
                    onChange={(val) => {
                      setMessageHtml(val);
                      if (val.trim()) handleAdminTypingSignal();
                    }}
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
