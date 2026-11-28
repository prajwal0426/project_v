const particles = Array.from({ length: 28 }, (_, index) => index);

export default function CinematicScene({ className = '' }) {
  return (
    <div className={`cinematic-scene ${className}`.trim()} aria-hidden="true">
      <div className="cinematic-starfield" />
      <div className="cinematic-hero-ambient" />
      <div className="cinematic-stage-flare" />
      <div className="cinematic-grid" />
      <div className="cinematic-fog cinematic-fog-left" />
      <div className="cinematic-fog cinematic-fog-right" />

      <div className="cinematic-particles">
        {particles.map((particle) => (
          <i
            key={particle}
            style={{
              '--particle-index': particle,
              left: `${(particle * 31 + 7) % 96}%`,
              top: `${(particle * 17 + 11) % 88}%`
            }}
          />
        ))}
      </div>
    </div>
  );
}
