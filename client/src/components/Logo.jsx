const VERTEX_LOGO_SRC = '/login-logo.png';

export default function Logo({ variant = 'header', showText = true, className = '' }) {
  return (
    <div className={`logo logo-${variant} ${className}`.trim()}>
      <span className="logo-asset-frame" aria-hidden="true">
        <img className="logo-asset" src={VERTEX_LOGO_SRC} alt="" />
      </span>
      {showText ? (
        <span className="logo-copy">
          <strong>VERTEX</strong>
          <span>Build. Rank. Earn.</span>
        </span>
      ) : null}
    </div>
  );
}
