function percent(value) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, parsed));
}

export function ProgressBar({ label, value }) {
  const safeValue = percent(value);
  return (
    <div className="progress-block">
      <span>
        {label}
        <b>{safeValue}%</b>
      </span>
      <div className="track">
        <i style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export default function ProgressSystem({ projectProgress = 0 }) {
  return (
    <section className="panel glass">
      <h3>Progress System</h3>
      <ProgressBar label="Project Progress" value={projectProgress} />
    </section>
  );
}
