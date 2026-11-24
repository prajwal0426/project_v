import { ChartNoAxesColumnIncreasing } from 'lucide-react';

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

export default function ProgressSystem({ projectProgress = 0, compact = false }) {
  if (compact) {
    const safeValue = percent(projectProgress);
    return (
      <section className="panel glass progress-summary">
        <div className="progress-summary-heading">
          <h3><ChartNoAxesColumnIncreasing aria-hidden="true" />Project Progress</h3>
          <strong>{safeValue}%</strong>
        </div>
        <div className="track" role="progressbar" aria-label="Project progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
          <i style={{ width: `${safeValue}%` }} />
        </div>
        <p>Complete projects to increase your progress.</p>
      </section>
    );
  }

  return (
    <section className="panel glass">
      <h3>Progress System</h3>
      <ProgressBar label="Project Progress" value={projectProgress} />
    </section>
  );
}
