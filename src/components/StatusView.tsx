export function StatusView({
  title,
  detail,
  error = false,
}: {
  title: string;
  detail: string;
  error?: boolean;
}) {
  return (
    <main className="status-view">
      <div
        className={error ? "status-mark error" : "status-mark"}
        aria-hidden="true"
      />
      <p className="eyebrow">ATL / 24</p>
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
