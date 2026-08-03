export function StatusView({
  title,
  detail,
  error = false,
  eyebrow = "FLIGHT / 24",
}: {
  title: string;
  detail: string;
  error?: boolean;
  eyebrow?: string;
}) {
  return (
    <main className="status-view">
      <div
        className={error ? "status-mark error" : "status-mark"}
        aria-hidden="true"
      />
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
