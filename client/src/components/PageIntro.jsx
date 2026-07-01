export default function PageIntro({ icon: Icon, title, text }) {
  return (
    <div className="page-intro glass">
      {Icon ? <Icon /> : null}
      <div>
        <p className="eyebrow">VERTEX PLATFORM</p>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
    </div>
  );
}
