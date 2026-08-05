import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InteractiveTimeline, RecordingTimeline } from "./Timelines";

describe("timeline variants", () => {
  it("renders endpoint labels and a display-only recording indicator", () => {
    const markup = renderToStaticMarkup(
      createElement(RecordingTimeline, { currentMinute: 720 }),
    );

    expect(markup.match(/12 AM/g)).toHaveLength(2);
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain("scaleX(0.5)");
    expect(markup).not.toContain('type="range"');
  });

  it("keeps an accessible scrubber in the interactive experience", () => {
    const markup = renderToStaticMarkup(
      createElement(InteractiveTimeline, {
        currentMinute: 720,
        onSeek: () => undefined,
      }),
    );

    expect(markup).toContain('type="range"');
    expect(markup).toContain('aria-label="Timeline"');
    expect(markup).toContain('value="720"');
  });
});
