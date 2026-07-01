export default function Logo({ imageSrc = null }) {
  return (
    <div className="logo">
      {imageSrc ? (
        <img className="logo-image" src={imageSrc} alt="VERTEX" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      ) : (
        <div className="logo-mark" aria-hidden="true">
          <span />
          <span />
        </div>
      )}
      <div>
        <strong>VERTEX</strong>
        <span>Build. Rank. Earn.</span>
      </div>
    </div>
  );
}
