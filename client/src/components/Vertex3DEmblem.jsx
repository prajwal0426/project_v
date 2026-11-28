import React from 'react';

// Dense volumetric slices give the 3D emblem substantial beveled thickness from front and side angles
const DEPTH_LAYERS = Array.from({ length: 22 }, (_, i) => {
  const z = (i - 10.5) * 0.95;
  return Number(z.toFixed(2));
});

export default function Vertex3DEmblem({ className = '' }) {
  return (
    <div
      className={`vertex-3d-emblem-wrapper ${className}`.trim()}
      aria-label="3D VERTEX Emblem"
      role="img"
    >
      {/* Subtle ambient purple backlight behind the emblem so metallic surfaces pop */}
      <div className="emblem-backlight" aria-hidden="true" />

      {/* 3D Cosmic Holographic Light Rings orbiting the emblem */}
      <div className="emblem-orbit-ring emblem-orbit-ring-one" aria-hidden="true" />
      <div className="emblem-orbit-ring emblem-orbit-ring-two" aria-hidden="true" />

      {/* Central 3D Stage - Fixed center position, starts front-facing, controlled gentle Y-axis turn */}
      <div className="vertex-3d-emblem-stage">
        <div className="vertex-3d-rotator">
          {/* Back Face */}
          <div className="emblem-face emblem-face-back">
            <img
              src="/vertex-emblem-original.png"
              alt=""
              className="emblem-asset emblem-asset-back"
              draggable="false"
            />
          </div>

          {/* Volumetric Metallic Obsidian & Purple Edge Extrusion Slices */}
          {DEPTH_LAYERS.map((z, idx) => (
            <div
              key={idx}
              className="emblem-extrusion-slice"
              style={{ transform: `translateZ(${z}px)` }}
              aria-hidden="true"
            >
              <img
                src="/vertex-emblem-original.png"
                alt=""
                className={`emblem-asset emblem-asset-extrusion ${idx === 0 || idx === DEPTH_LAYERS.length - 1 ? 'emblem-edge-rim' : ''}`}
                draggable="false"
              />
            </div>
          ))}

          {/* Front Face */}
          <div className="emblem-face emblem-face-front">
            <img
              src="/vertex-emblem-original.png"
              alt="VERTEX Symbol"
              className="emblem-asset emblem-asset-front"
              draggable="false"
            />
            <div className="emblem-specular-sweep" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
