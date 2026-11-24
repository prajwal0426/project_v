import React from 'react';

export default function VertexEnergyPlatform({ className = '' }) {
  return (
    <div className={`vertex-energy-platform ${className}`.trim()} aria-hidden="true">
      {/* 3D Perspective Glass Disc Stage */}
      <div className="platform-stage">
        {/* Soft Ground Contact Shadow on the grid floor */}
        <div className="platform-shadow" />

        {/* Ambient Ground Glow / Volumetric Light Wash */}
        <div className="platform-ambient-wash" />

        {/* 3D Tilted Glass Disc with Beveled Metallic Rim */}
        <div className="platform-glass-disc">
          <div className="glass-disc-surface" />
          <div className="glass-disc-rim" />

          {/* Holographic Precision Rings & Geometric Detailing */}
          <svg className="platform-holo-rings" viewBox="0 0 400 120" fill="none">
            {/* Outer segmented precision track */}
            <ellipse
              cx="200"
              cy="60"
              rx="174"
              ry="46"
              stroke="rgba(192, 132, 252, 0.3)"
              strokeWidth="1"
              strokeDasharray="5 10"
            />

            {/* Cardinal precision tick marks */}
            <line x1="22" y1="60" x2="32" y2="60" stroke="rgba(216, 180, 254, 0.65)" strokeWidth="1.2" />
            <line x1="368" y1="60" x2="378" y2="60" stroke="rgba(216, 180, 254, 0.65)" strokeWidth="1.2" />
            <line x1="200" y1="12" x2="200" y2="18" stroke="rgba(216, 180, 254, 0.65)" strokeWidth="1.2" />
            <line x1="200" y1="102" x2="200" y2="108" stroke="rgba(216, 180, 254, 0.65)" strokeWidth="1.2" />

            {/* Intermediate energy resonance ring */}
            <ellipse
              cx="200"
              cy="60"
              rx="130"
              ry="34"
              stroke="rgba(168, 85, 247, 0.45)"
              strokeWidth="1.2"
            />

            {/* Inner high-intensity energy ring with glow filter */}
            <ellipse
              cx="200"
              cy="60"
              rx="86"
              ry="22"
              stroke="rgba(216, 180, 254, 0.78)"
              strokeWidth="1.5"
              filter="url(#holo-glow-filter)"
            />

            {/* Core focus emitter ring */}
            <ellipse
              cx="200"
              cy="60"
              rx="44"
              ry="11"
              stroke="#ffffff"
              strokeWidth="1.6"
            />

            <defs>
              <filter id="holo-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </svg>

          {/* Central Volumetric Plasma Core Hotspot */}
          <div className="platform-core-plasma" />

          {/* Focused Energy Well / Soft Upward Beam connecting to Emblem Apex */}
          <div className="platform-energy-well" />
        </div>

        {/* Micro Energy Particles floating up toward the emblem */}
        <div className="platform-energy-sparks">
          <span className="spark spark-1" />
          <span className="spark spark-2" />
          <span className="spark spark-3" />
          <span className="spark spark-4" />
          <span className="spark spark-5" />
          <span className="spark spark-6" />
        </div>
      </div>
    </div>
  );
}
