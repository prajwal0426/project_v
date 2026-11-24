import React from 'react';

// Generates volumetric depth slices for 3D extrusion (compact, high-fidelity profile)
const DEPTH_LAYERS = Array.from({ length: 16 }, (_, i) => {
  const z = (i - 7.5) * 0.95;
  return Number(z.toFixed(2));
});

export default function Vertex3DEmblem({ className = '' }) {
  return (
    <div
      className={`vertex-3d-emblem-wrapper ${className}`.trim()}
      aria-label="3D VERTEX Emblem"
      role="img"
    >
      {/* Central 3D Rotating Stage - Strictly anchored at center, 360° rotation around own Y-axis */}
      <div className="vertex-3d-emblem-stage">
        <div className="vertex-3d-rotator">
          {/* Back Face (facing rear at -8px) */}
          <div className="emblem-face emblem-face-back">
            <img
              src="/vertex-emblem-original.png"
              alt=""
              className="emblem-asset emblem-asset-back"
              draggable="false"
            />
          </div>

          {/* Volumetric Metallic Obsidian Slices (giving physical 3D thickness and bevel) */}
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
                className="emblem-asset emblem-asset-extrusion"
                draggable="false"
              />
            </div>
          ))}

          {/* Front Face (facing forward at +8px) */}
          <div className="emblem-face emblem-face-front">
            <img
              src="/vertex-emblem-original.png"
              alt="VERTEX Symbol"
              className="emblem-asset emblem-asset-front"
              draggable="false"
            />
            {/* Dynamic Specular Sheen across metallic surface */}
            <div className="emblem-specular-sweep" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
