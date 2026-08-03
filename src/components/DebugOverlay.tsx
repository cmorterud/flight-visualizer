export function DebugOverlay({
  minute,
  active,
  paths,
  file,
  fps,
  zoom,
  speed,
}: {
  minute: number;
  active: number;
  paths: number;
  file: string;
  fps: number;
  zoom: number;
  speed: number;
}) {
  return (
    <aside className="debug-overlay" aria-label="Debug information">
      <strong>RENDER DEBUG</strong>
      <span>minute {minute.toFixed(2)}</span>
      <span>active {active}</span>
      <span>paths {paths}</span>
      <span>fps {fps}</span>
      <span>zoom {zoom.toFixed(2)}</span>
      <span>speed {speed}×</span>
      <span>{file}</span>
    </aside>
  );
}
