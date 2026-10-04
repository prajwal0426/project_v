const particles = Array.from({ length: 18 }, (_, index) => index);

export default function CinematicScene({ className = '' }) {
  return (
    <div className={`cinematic-scene ${className}`.trim()} aria-hidden="true">
      <div className="cinematic-starfield" />
      <div className="cinematic-grid" />
      <div className="cinematic-orbit cinematic-orbit-one" />
      <div className="cinematic-orbit cinematic-orbit-two" />
      <div className="cinematic-haze cinematic-haze-left" />
      <div className="cinematic-haze cinematic-haze-right" />
      <div className="cinematic-particles">
        {particles.map((particle) => (
          <i
            key={particle}
            style={{
              '--particle-index': particle,
              left: `${(particle * 37) % 94}%`,
              top: `${(particle * 19) % 82}%`
            }}
          />
        ))}
      </div>
    </div>
  );
}
