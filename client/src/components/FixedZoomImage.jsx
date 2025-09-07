import React, { useRef, useState } from "react";

export default function FixedZoomImage({ src, alt, width = 1000, height = 600, zoom = 2, lensSize = 180, ...props }) {
  const imgRef = useRef(null);
  const lensRef = useRef(null);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });

  // Move lens and fix it in the center
  const handleMouseEnter = () => setShowLens(true);
  const handleMouseLeave = () => setShowLens(false);
  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    // Always center lens
    setLensPos({
      x: rect.width / 2 - lensSize / 2,
      y: rect.height / 2 - lensSize / 2,
    });
  };

  // Calculate background position for zoom
  const bgX = -(lensPos.x * zoom - lensSize / 2);
  const bgY = -(lensPos.y * zoom - lensSize / 2);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "inline-block",
        borderRadius: 20,
        overflow: "hidden",
        background: "#f3f4f6",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          borderRadius: 20,
          cursor: "zoom-in",
        }}
        draggable={false}
        {...props}
      />
      {showLens && (
        <div
          ref={lensRef}
          style={{
            position: "absolute",
            left: lensPos.x,
            top: lensPos.y,
            width: lensSize,
            height: lensSize,
            borderRadius: "50%",
            border: "2px solid #1976d2",
            boxShadow: "0 2px 12px #0003",
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${width * zoom}px ${height * zoom}px`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      )}
      {/* Лупа иконка */}
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          background: "rgba(255,255,255,0.85)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px #0002",
          zIndex: 30,
        }}
      >
        <svg width="24" height="24" fill="none" stroke="#1976d2" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </div>
    </div>
  );
}
