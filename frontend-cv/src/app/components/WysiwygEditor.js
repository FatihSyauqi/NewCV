"use client";

import { useRef, useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitizer";

const POPULAR_EMOJIS = [
  "😊", "👍", "🙏", "🚀", "💡", "🔥", "❤️", "👋", 
  "💼", "💻", "🎯", "✅", "📞", "💬", "📝", "📁", 
  "⭐", "🎉", "🤝", "👌", "🙌", "⚡", "📌", "✨"
];

export default function WysiwygEditor({ value, onChange, onSend, placeholder = "Ketik pesan Anda di sini..." }) {
  const editorRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === "") {
        editorRef.current.innerHTML = "";
      }
    }
  }, [value]);

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const rawHtml = editorRef.current.innerHTML;
      const cleanHtml = sanitizeHtml(rawHtml);
      onChange(cleanHtml);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSend) {
        onSend();
      }
    }
  };

  const addLink = () => {
    const url = prompt("Masukkan URL link (contoh: https://example.com):");
    if (url) {
      const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      executeCommand("createLink", formattedUrl);
    }
  };

  const insertEmoji = (emoji) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, emoji);
      handleInput();
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="wysiwyg-wrapper border rounded-3 bg-white shadow-xs position-relative">
      {/* Toolbar */}
      <div className="wysiwyg-toolbar bg-light border-bottom p-1.5 d-flex flex-wrap align-items-center justify-content-between gap-1 rounded-top-3">
        <div className="d-flex align-items-center flex-wrap gap-1">
          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("bold")}
            title="Bold (Ctrl+B)"
          >
            <i className="bi bi-type-bold fw-bold"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("italic")}
            title="Italic (Ctrl+I)"
          >
            <i className="bi bi-type-italic"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("underline")}
            title="Underline (Ctrl+U)"
          >
            <i className="bi bi-type-underline"></i>
          </button>

          <div className="vr mx-1 my-1 opacity-25"></div>

          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("insertUnorderedList")}
            title="Bullet List"
          >
            <i className="bi bi-list-ul"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("insertOrderedList")}
            title="Numbered List"
          >
            <i className="bi bi-list-ol"></i>
          </button>

          <div className="vr mx-1 my-1 opacity-25"></div>

          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={addLink}
            title="Insert Link"
          >
            <i className="bi bi-link-45deg"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 py-0.5 px-2 text-dark"
            onClick={() => executeCommand("removeFormat")}
            title="Clear Formatting"
          >
            <i className="bi bi-trash3"></i>
          </button>
        </div>

        {/* Emoji Button & Floating Picker */}
        <div className="position-relative">
          <button
            type="button"
            className={`btn btn-sm ${showEmojiPicker ? "btn-primary text-white" : "btn-light text-dark"} border-0 py-0.5 px-2`}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Pilih Emoji"
          >
            <i className="bi bi-emoji-smile fs-6"></i>
          </button>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div
              className="position-absolute bottom-100 end-0 mb-2 p-2 bg-white border rounded-3 shadow-lg"
              style={{
                width: "230px",
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "4px",
                zIndex: 1050,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
              }}
            >
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="btn btn-sm btn-light border-0 p-1 fs-5 text-center hover-bg-primary-subtle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertEmoji(emoji);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable Container with Padding */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="wysiwyg-editor outline-none text-dark rounded-bottom-3"
        style={{
          minHeight: "65px",
          maxHeight: "130px",
          overflowY: "auto",
          fontSize: "0.95rem",
          lineHeight: "1.5",
          padding: "12px 14px"
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        .wysiwyg-editor:empty:before {
          content: attr(data-placeholder);
          color: #adb5bd;
          cursor: text;
        }
        .wysiwyg-editor:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
