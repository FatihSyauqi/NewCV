"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WysiwygEditor from "./WysiwygEditor";
import { sanitizeHtml } from "@/lib/sanitizer";

const getLastMessagePreview = (s) => {
  if (s.last_message_html) {
    // Strip nested blockquotes (quotes) first, then strip remaining HTML tags
    const withoutBlockquotes = (s.last_message_html || "").replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, "");
    const cleanText = withoutBlockquotes.replace(/<[^>]+>/g, "").trim();
    if (cleanText) return cleanText;
  }
  if (s.last_attachment_name) {
    return `📎 ${s.last_attachment_name}`;
  }
  return s.initial_message || s.full_name;
};

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

  // Typing Indicator state
  const [isAdminTyping, setIsAdminTyping] = useState(false);

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
  const lastTypingSignalRef = useRef(0);

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
    } catch (e) { }
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

        // Auto-select active session ONLY if cv_chat_token exists in localStorage
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("cv_chat_token") : null;
        if (!sessionToken && savedToken && data.sessions && data.sessions.length > 0) {
          const matched = data.sessions.find(s => s.session_token === savedToken);
          if (matched) {
            setSessionToken(matched.session_token);
          }
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

  // ── Fetch messages helper (used by both WebSocket and fallback polling) ──
  const fetchMessages = useCallback(async () => {
    if (!sessionToken) return;
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
      setIsAdminTyping(!!data.is_admin_typing);

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
  }, [sessionToken, playNotificationSound]);

  // Fetch on mount + 15s fallback polling (WebSocket handles real-time)
  useEffect(() => {
    if (!sessionToken) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [sessionToken, fetchMessages]);

  // ── WebSocket connection for real-time push notifications ──────────────
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionToken) return;
    let ws = null;
    let reconnectTimer = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const hostname = window.location.hostname;
        ws = new WebSocket(`${protocol}//${hostname}:3003`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "subscribe", token: sessionToken }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "messages_update") {
              fetchMessages();
            } else if (msg.type === "admin_typing") {
              setIsAdminTyping(!!msg.typing);
            }
            // ping — no action needed
          } catch (_) { }
        };

        ws.onclose = () => {
          if (mounted) {
            // Auto-reconnect after 5 seconds
            reconnectTimer = setTimeout(connect, 5000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        // WebSocket not available — polling fallback is active
        console.warn("[ws-cv] WebSocket not available, using polling fallback");
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [sessionToken, fetchMessages]);

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

  // Handle Visitor typing signal heartbeat
  const handleUserTypingSignal = () => {
    if (!sessionToken) return;
    const now = Date.now();
    if (now - lastTypingSignalRef.current > 2000) {
      lastTypingSignalRef.current = now;
      fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, action: "typing" })
      }).catch(() => { });

      // Send instant WS signal to admin
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "visitor_typing", token: sessionToken, typing: true }));
      }
    }
  };

  // Add a message to MS Teams Quote Reply list
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

  // Handle Pre-Chat Form submission
  const handleInitSubmit = async (e) => {
    e.preventDefault();
    setInitError("");
    setLoadingInit(true);

    try {
      const vid = visitorDeviceId || localStorage.getItem("cv_visitor_id");

      // Resolve Public IP via client-side API fallback
      let clientPublicIp = null;
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientPublicIp = ipData.ip;
        }
      } catch (ipErr) { }

      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initForm,
          visitor_device_id: vid,
          client_public_ip: clientPublicIp
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

      // Optimistic UI update: Push temp message with sending = true
      const tempId = "temp_" + Date.now();
      const tempMsg = {
        id: tempId,
        session_id: sessionData?.id || 0,
        sender_type: "user",
        sender_name: sessionData?.full_name || "Visitor",
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

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "visitor_message_sent", token: sessionToken }));
      }

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

  // Handle Re-open Session from Visitor (If closed by user)
  const handleReopenSession = async () => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, action: "reopen_session" })
      });
      if (res.ok) {
        setSessionData((prev) => prev ? { ...prev, status: "active", closed_by: null } : null);
        fetchUserChatHistory();
      }
    } catch (err) {
      console.error("Reopen session error:", err);
    }
  };

  // Open Form to Start New Chat Session
  const handleStartNewSession = () => {
    localStorage.removeItem("cv_chat_token");
    setSessionToken(null);
    setSessionData(null);
    setMessages([]);
    setQuotedMessages([]);
    setShowHistoryMenu(false);
    setInitForm({ full_name: "", email: "", phone_number: "", initial_message: "" });
    setInitError("");
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
          className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative animate-fade-in"
          style={{
            width: "380px",
            height: "560px",
            maxWidth: "92vw",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            marginBottom: "12px",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
          }}
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
              <h5 className="fw-bold mb-1">Lepaskan File di Sini</h5>
              <p className="small mb-0 text-white-50 text-center">Maksimal 2 MB (Gambar PNG/JPG/WEBP, PDF, Word)</p>
            </div>
          )}

          {/* Header Widget */}
          <div
            className="p-3 text-white d-flex align-items-center justify-content-between shadow-xs"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
          >
            <div className="d-flex align-items-center gap-3 me-2">
              <div className="position-relative flex-shrink-0">
                <div
                  className="fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                  style={{
                    width: "40px",
                    height: "40px",
                    fontSize: "14px",
                    backgroundColor: "#f59e0b",
                    color: "#000000"
                  }}
                >
                  FS
                </div>
                <span
                  className="position-absolute bottom-0 end-0 rounded-circle"
                  style={{
                    width: "11px",
                    height: "11px",
                    backgroundColor: "#22c55e",
                    border: "2px solid #2563eb"
                  }}
                  title="Admin Online"
                ></span>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white" style={{ fontSize: "15px", lineHeight: "1.2" }}>
                  Live Chat
                </h6>
                <small className="text-white fw-medium d-block" style={{ fontSize: "11px", opacity: 0.92, lineHeight: "1.3" }}>
                  Fatih Syauqi • Senior Software Engineer
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
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
                          className={`p-3 rounded-3 border transition-all cursor-pointer ${isCurrent
                            ? "bg-white border-primary border-2 shadow-xs"
                            : "bg-white border-slate-200 hover-border-primary"
                            }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fw-bold text-dark text-truncate" style={{ fontSize: "13px", maxWidth: "200px" }}>
                              {getLastMessagePreview(s)}
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
                              className={`badge ${s.status === "active"
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
                className="btn btn-sm btn-outline-secondary w-100 mt-3 rounded-3"
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

                  <form id="chatInitForm" onSubmit={handleInitSubmit} className="d-flex flex-column justify-content-between">
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

                    <button
                      type="submit"
                      className="btn w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 text-white border-0 shadow-sm mt-2"
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
                  </form>
                </div>
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
                          <div className="d-flex align-items-center gap-2 mb-1 px-1">
                            <small className="fw-semibold text-slate-700" style={{ fontSize: "11px", color: "#475569" }}>
                              {msg.sender_name}
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

                          {/* WhatsApp Style Bubble with Font Warna Hitam */}
                          <div
                            className="shadow-xs border"
                            style={{
                              maxWidth: "88%",
                              fontSize: "0.92rem",
                              lineHeight: "1.5",
                              background: isUser ? "#d9fdd3" : "#ffffff",
                              color: "#1e293b",
                              borderColor: isUser ? "#d9fdd3" : "#e2e8f0",
                              borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                              padding: "6px 10px 6px 12px",
                              minWidth: "85px",
                              display: "inline-block"
                            }}
                          >
                            {/* Inject CSS override to display editor paragraphs inline inside chat bubbles */}
                            <style dangerouslySetInnerHTML={{
                              __html: `
                              .message-rich-content, .message-rich-content p {
                                display: inline !important;
                                margin: 0 !important;
                              }
                            `}} />

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
                              <div className="mt-2 pt-2 border-top border-slate-200 d-block" style={{ display: "block" }}>
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
                              {isUser && (
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
                    })
                  )}

                  {/* Typing Indicator Balloon when Admin is typing */}
                  {isAdminTyping && (
                    <div className="d-flex flex-column align-items-start mb-3 animate-fade-in">
                      <small className="fw-semibold text-slate-500 mb-1 px-1" style={{ fontSize: "10px", color: "#64748b" }}>
                        Fatih Syauqi (Admin)
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

                {/* Status Notice Banner if Session is Closed or Blocked */}
                {isSessionClosed ? (
                  <div className="p-3 bg-light border-top text-center shadow-xs">
                    <div className="alert alert-secondary small mb-2 py-2 px-3 border-0 fw-semibold text-dark">
                      <i className="bi bi-lock-fill text-primary me-1"></i>
                      Sesi obrolan ini telah diakhiri {sessionData?.closed_by === 'user' ? 'oleh Anda' : 'oleh Admin'}. Terima kasih!
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                      {sessionData?.closed_by === 'user' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success text-white rounded-pill px-3 fw-bold shadow-xs"
                          onClick={handleReopenSession}
                        >
                          <i className="bi bi-unlock-fill me-1"></i> Buka Kembali Sesi Ini
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-xs"
                        onClick={handleStartNewSession}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Percakapan Baru
                      </button>
                    </div>
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

                    {/* File Attachment Badge Preview + Caption Input */}
                    {attachment && (
                      <div className="bg-slate-100 p-2 mb-2 rounded-3 border shadow-2xs" style={{ backgroundColor: "#f1f5f9" }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="text-truncate fw-semibold text-slate-700 me-2" style={{ maxWidth: "240px", fontSize: "12px" }}>
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
                        if (val.trim()) handleUserTypingSignal();
                      }}
                      onSend={handleSendMessage}
                      placeholder="Ketik pesan Anda..."
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
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <>
                              <i className="bi bi-paperclip"></i>
                              <span className="small">Lampiran</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Kirim Button (Icon Envelope) */}
                      <button
                        type="button"
                        className="btn btn-sm px-3 py-1.5 text-white fw-semibold border-0 rounded-3 d-flex align-items-center gap-2 shadow-xs"
                        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
                        onClick={handleSendMessage}
                        disabled={sendingMessage || (!messageHtml.trim() && !attachment && quotedMessages.length === 0)}
                      >
                        {sendingMessage ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Kirim...</span>
                          </>
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

      {/* ── Trigger Chat Floating Pill Button ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn text-white rounded-pill px-4 py-2.5 shadow-lg d-flex align-items-center gap-2 animate-bounce-slow"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", border: "2px solid #ffffff" }}
        >
          <i className="bi bi-chat-dots-fill fs-5"></i>
          <span className="fw-bold">Live Chat</span>
          {unreadCount > 0 && (
            <span className="badge rounded-pill bg-danger ms-1">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── File Preview Modal Popup ── */}
      {previewFile && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 10500 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: "92%", maxWidth: "500px", maxHeight: "80vh" }}>
            <div className="p-3 text-white d-flex align-items-center justify-content-between" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
              <h6 className="mb-0 text-truncate text-white fw-bold" style={{ maxWidth: "80%" }}>
                <i className="bi bi-file-earmark-text me-2"></i> {previewFile.name}
              </h6>
              <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewFile(null)}></button>
            </div>
            <div className="p-3 bg-light overflow-y-auto d-flex align-items-center justify-content-center" style={{ minHeight: "260px", maxHeight: "calc(80vh - 120px)" }}>
              {isImageFile(previewFile.url) ? (
                <img src={previewFile.url} alt={previewFile.name} className="img-fluid rounded shadow-sm" style={{ maxHeight: "360px", objectFit: "contain" }} />
              ) : previewFile.url.endsWith(".pdf") ? (
                <iframe src={previewFile.url} title={previewFile.name} width="100%" height="350px" className="border rounded" />
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
