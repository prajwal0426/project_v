import { GlassCard } from './GlassPrimitives.jsx';

export default function PageIntro({ icon: Icon, title, text }) {
  return (
    <GlassCard as="div" className="page-intro">
      {Icon ? <Icon /> : null}
      <div>
        <p className="eyebrow">VERTEX PLATFORM</p>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
    </GlassCard>
  );
}
