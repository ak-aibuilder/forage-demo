export function ErrorDisplay({ message, requestId, onRetry }: { message: string; requestId?: string; onRetry: () => void }) {
  return (
    <section className="error-panel" role="alert">
      <div className="eyebrow">Agent unavailable</div>
      <h2>We could not compose this cart.</h2>
      <p>{message}</p>
      {requestId && <p className="request-id">Request ID: {requestId}</p>}
      <button className="secondary-button" type="button" onClick={onRetry}>Try again</button>
    </section>
  );
}
