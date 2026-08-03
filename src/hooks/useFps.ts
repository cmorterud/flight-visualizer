import { useEffect, useRef, useState } from "react";

export function useFps(): number {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(0);
  useEffect(() => {
    last.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      frames.current += 1;
      if (now - last.current >= 750) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return fps;
}
