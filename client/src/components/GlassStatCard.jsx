import { GlassCard } from './GlassPrimitives.jsx';

export default function GlassStatCard({ icon: Icon, label, value, detail }) {
  return (
    <GlassCard as="article" className="metric">
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </GlassCard>
  );
}
