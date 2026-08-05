export function DebugOverlay({
  minute,
  active,
  arrived,
  departed,
  paths,
  file,
  fps,
  zoom,
  speed,
  phase,
  pacing,
  elapsed,
  expectedDuration,
}: {
  minute: number;
  active: number;
  arrived?: number;
  departed?: number;
  paths: number;
  file: string;
  fps: number;
  zoom: number;
  speed: number;
  phase?: string;
  pacing?: string;
  elapsed?: number;
  expectedDuration?: number;
}) {
  return (
    <aside className="debug-overlay" aria-label="Debug information">
      <strong>RENDER DEBUG</strong>
      <span>minute {minute.toFixed(2)}</span>
      {phase && <span>phase {phase}</span>}
      <span>active {active}</span>
      {arrived !== undefined && <span>arrived {arrived}</span>}
      {departed !== undefined && <span>departed {departed}</span>}
      <span>paths {paths}</span>
      <span>fps {fps}</span>
      <span>zoom {zoom.toFixed(2)}</span>
      <span>speed {speed}×</span>
      {pacing && <span>pacing {pacing}</span>}
      {elapsed !== undefined && <span>elapsed {elapsed.toFixed(2)}s</span>}
      {expectedDuration !== undefined && (
        <span>expected {expectedDuration.toFixed(2)}s</span>
      )}
      <span>
        viewport {window.innerWidth}×{window.innerHeight}
      </span>
      <span>{file}</span>
    </aside>
  );
}
