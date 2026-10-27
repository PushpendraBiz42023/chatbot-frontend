interface SpinnerProps {
  label?: string;
}

/** Full-area loading indicator, e.g. while auth is initializing. */
export function Spinner({ label = "Loading…" }: SpinnerProps) {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
