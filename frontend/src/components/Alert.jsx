// Shows error / success messages (and a loading spinner)
export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`} role="alert">{children}</div>;
}

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader">
      <span className="spinner" /> {text}
    </div>
  );
}
