"use client";

import { useState, useRef, useEffect } from "react";

export default function MarqueeScroller({ skills = [] }) {
  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const manualTimeoutRef = useRef(null);

  // Duplicate items 6 times for seamless continuous infinite looping
  const displaySkills = [
    ...skills,
    ...skills,
    ...skills,
    ...skills,
    ...skills,
    ...skills,
  ];

  // Infinite loop wrap check
  const handleScrollWrap = () => {
    const container = containerRef.current;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const oneThird = container.scrollWidth / 3;

    // If reached near end, jump back seamlessly to middle
    if (container.scrollLeft >= maxScroll - 20) {
      container.scrollLeft = container.scrollLeft - oneThird;
    }
    // If reached start when dragging left, jump forward to middle
    else if (container.scrollLeft <= 20) {
      container.scrollLeft = container.scrollLeft + oneThird;
    }
  };

  // Initial scroll position setup
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollLeft = container.scrollWidth / 3;
    }
  }, [skills]);

  // Auto-scroll loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId;
    const speed = 0.8; // Smooth 60fps auto-scroll speed

    const autoScroll = () => {
      if (!isMouseDown && !isHovered && !isManualScrolling) {
        container.scrollLeft += speed;
        handleScrollWrap();
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isMouseDown, isHovered, isManualScrolling]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    setIsMouseDown(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
    setIsHovered(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2.2; // Drag multiplier
    containerRef.current.scrollLeft = scrollLeftState - walk;
    handleScrollWrap();
  };

  // Touch Drag Handlers for Mobile
  const handleTouchStart = (e) => {
    setIsMouseDown(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isMouseDown) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.8;
    containerRef.current.scrollLeft = scrollLeftState - walk;
    handleScrollWrap();
  };

  // Button Scroll Handlers with auto-scroll pause
  const triggerManualScroll = (direction) => {
    const container = containerRef.current;
    if (!container) return;

    setIsManualScrolling(true);
    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);

    const distance = direction === "left" ? -320 : 320;
    container.scrollBy({ left: distance, behavior: "smooth" });

    // Resume auto-scroll after smooth scroll animation completes
    manualTimeoutRef.current = setTimeout(() => {
      setIsManualScrolling(false);
      handleScrollWrap();
    }, 650);
  };

  return (
    <div className="position-relative d-flex align-items-center px-4">
      {/* Left Arrow Button */}
      <button
        type="button"
        onClick={() => triggerManualScroll("left")}
        className="btn btn-light rounded-circle shadow border border-light-subtle d-flex align-items-center justify-content-center position-absolute start-0 z-3 text-primary"
        style={{
          width: "44px",
          height: "44px",
          transition: "all 0.2s ease",
          cursor: "pointer",
          left: "-5px",
        }}
        title="Geser Kiri"
      >
        <i className="bi bi-chevron-left fs-5 fw-bold"></i>
      </button>

      {/* Draggable Scroll Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={() => setIsMouseDown(false)}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setIsHovered(true)}
        onScroll={handleScrollWrap}
        className="marquee-drag-container flex-grow-1 mx-4 overflow-hidden py-3"
        style={{
          cursor: isMouseDown ? "grabbing" : "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
          whiteSpace: "nowrap",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="d-inline-flex gap-3 align-items-center">
          {displaySkills.map((skill, idx) => (
            <div
              key={idx}
              className="marquee-item d-flex flex-column align-items-center justify-content-center gap-2 px-3 py-3 bg-white rounded-4 shadow-sm border border-light-subtle flex-shrink-0"
              style={{ width: "160px", minWidth: "160px" }}
            >
              {skill.logo_url ? (
                <img
                  src={skill.logo_url}
                  alt={skill.name}
                  draggable="false"
                  style={{
                    width: "72px",
                    height: "72px",
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />
              ) : (
                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "72px", height: "72px" }}
                >
                  <i className="bi bi-code-slash fs-3"></i>
                </div>
              )}
              <div className="text-center w-100">
                <span
                  className="d-block fw-bold text-dark text-truncate"
                  style={{ fontSize: "0.85rem" }}
                  title={skill.name}
                >
                  {skill.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        onClick={() => triggerManualScroll("right")}
        className="btn btn-light rounded-circle shadow border border-light-subtle d-flex align-items-center justify-content-center position-absolute end-0 z-3 text-primary"
        style={{
          width: "44px",
          height: "44px",
          transition: "all 0.2s ease",
          cursor: "pointer",
          right: "-5px",
        }}
        title="Geser Kanan"
      >
        <i className="bi bi-chevron-right fs-5 fw-bold"></i>
      </button>
    </div>
  );
}
