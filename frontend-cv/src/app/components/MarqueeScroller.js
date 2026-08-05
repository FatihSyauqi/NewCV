"use client";

import { useState } from "react";

export default function MarqueeScroller({ skills = [] }) {
  const [marqueeDir, setMarqueeDir] = useState("normal"); // "normal" or "reverse"

  return (
    <div className="position-relative d-flex align-items-center px-4">
      {/* Left Arrow */}
      <button 
        type="button"
        onClick={() => setMarqueeDir("reverse")}
        className={`btn btn-light rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center position-absolute start-0 z-3 ${marqueeDir === "reverse" ? "text-primary border-primary animate-pulse" : "text-muted"}`} 
        style={{ width: "40px", height: "40px", transition: "all 0.2s ease", cursor: "pointer", left: "-5px" }}
        title="Scroll Left"
      >
        <i className="bi bi-chevron-left fs-5 fw-bold"></i>
      </button>

      <div className="marquee-container flex-grow-1 mx-4">
        <div className="marquee-content" style={{ animationDirection: marqueeDir }}>
          {[...skills, ...skills, ...skills].map((skill, idx) => (
            <div key={idx} className="marquee-item d-flex flex-column align-items-center justify-content-center gap-2 px-3 py-3 bg-white rounded-4 shadow-sm border border-light-subtle" style={{ width: "160px", minWidth: "160px" }}>
              {skill.logo_url ? (
                <img 
                  src={skill.logo_url} 
                  alt={skill.name} 
                  style={{ width: "72px", height: "72px", objectFit: "contain" }} 
                />
              ) : (
                <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "72px", height: "72px" }}>
                  <i className="bi bi-code-slash fs-3"></i>
                </div>
              )}
              <div className="text-center w-100">
                <span className="d-block fw-bold text-dark text-truncate" style={{ fontSize: "0.85rem" }} title={skill.name}>{skill.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <button 
        type="button"
        onClick={() => setMarqueeDir("normal")}
        className={`btn btn-light rounded-circle shadow-sm border border-light-subtle d-flex align-items-center justify-content-center position-absolute end-0 z-3 ${marqueeDir === "normal" ? "text-primary border-primary animate-pulse" : "text-muted"}`} 
        style={{ width: "40px", height: "40px", transition: "all 0.2s ease", cursor: "pointer", right: "-5px" }}
        title="Scroll Right"
      >
        <i className="bi bi-chevron-right fs-5 fw-bold"></i>
      </button>
    </div>
  );
}
