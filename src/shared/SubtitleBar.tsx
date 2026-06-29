import React from "react";
import { interpolate } from "remotion";

export interface Subtitle {
  start: number;
  end: number;
  line1: string;
  line2: string;
}

export const SubtitleBar: React.FC<{
  time: number;
  subtitles: Subtitle[];
}> = ({ time, subtitles }) => {
  const active = subtitles.find((s) => time >= s.start && time <= s.end);
  if (!active) return null;

  const fadeIn = interpolate(
    time,
    [active.start, active.start + 0.3],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const fadeOut = interpolate(time, [active.end - 0.3, active.end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.70)",
          borderRadius: 12,
          padding: "14px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 26,
            lineHeight: "38px",
            color: "#ffffff",
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
        >
          {active.line1}
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: "38px",
            color: "#ffffff",
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
        >
          {active.line2}
        </div>
      </div>
    </div>
  );
};
