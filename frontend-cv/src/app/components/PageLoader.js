"use client";

import { useState, useEffect } from "react";

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(60), 200);
    const timer2 = setTimeout(() => setProgress(90), 450);
    const timer3 = setTimeout(() => setProgress(100), 700);

    const finishTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 450);
    }, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`page-loader-overlay ${fadeOut ? "fade-out" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        transition: "opacity 0.45s ease, visibility 0.45s ease",
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? "hidden" : "visible",
      }}
    >
      {/* Central Executive Brand Signature */}
      <div className="position-relative text-center mb-4">
        {/* Glow Aura */}
        <div
          className="position-absolute top-50 start-50 translate-middle rounded-circle"
          style={{
            width: "180px",
            height: "180px",
            background: "radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0) 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        ></div>

        {/* Signature Logo */}
        <h1
          className="brand-signature text-white mb-0 position-relative"
          style={{ fontSize: "3.2rem", letterSpacing: "1px" }}
        >
          Fatih Syauqi<span className="brand-dot-pulse">.</span>
        </h1>
      </div>

      {/* Ultra-Sleek Glowing Progress Bar */}
      <div
        className="progress rounded-pill overflow-hidden position-relative shadow-sm"
        style={{
          width: "200px",
          height: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="progress-bar rounded-pill position-relative"
          role="progressbar"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
            boxShadow: "0 0 12px rgba(56, 189, 248, 0.7)",
            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        ></div>
      </div>
    </div>
  );
}
