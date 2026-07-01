export default function EmptyState({ title, message }) {
  return (
    <div className="state-card glass">
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
