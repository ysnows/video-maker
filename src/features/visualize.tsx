import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  OffthreadVideo,
  staticFile,
  interpolate,
  Audio,
  Sequence,
} from "remotion";
import { LogoCard } from "../shared/LogoCard";
import { SubtitleBar, type Subtitle } from "../shared/SubtitleBar";

const SUBTITLES: Subtitle[] = [
  {
    start: 0.5,
    end: 6.3,
    line1: "Just describe the data you want",
    line2: "to visualize — in your own words.",
  },
  {
    start: 7,
    end: 13.9,
    line1: "Enconvo understands your request and",
    line2: "generates a beautiful, interactive chart.",
  },
  {
    start: 14.5,
    end: 22.9,
    line1: "Multiple data series, beautifully rendered —",
    line2: "interactive charts you can explore in real time.",
  },
  {
    start: 23.5,
    end: 32,
    line1: "From prompt to visualization, in seconds.",
    line2: "Enconvo — your AI productivity assistant.",
  },
];

export const VIDEO_SECONDS = 32.9;
export const LOGO_SECONDS = 5;
export const TOTAL_SECONDS = VIDEO_SECONDS + LOGO_SECONDS;

export const VisualizePromo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const logoStartFrame = Math.round(VIDEO_SECONDS * fps);
  const isLogoPhase = frame >= logoStartFrame;

  const videoFadeOut = interpolate(
    frame,
    [logoStartFrame - 30, logoStartFrame],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a1c",
        fontFamily:
          '-apple-system, "system-ui", "SF Pro Text", "Segoe UI", system-ui, sans-serif',
      }}
    >
      {!isLogoPhase && (
        <div style={{ position: "absolute", inset: 0, opacity: videoFadeOut }}>
          <OffthreadVideo
            src={staticFile("visualize/source.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
          <SubtitleBar time={time} subtitles={SUBTITLES} />
        </div>
      )}

      {isLogoPhase && <LogoCard startFrame={logoStartFrame} />}

      <Sequence from={Math.round(0.5 * fps)}>
        <Audio src={staticFile("visualize/narr_01.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(7 * fps)}>
        <Audio src={staticFile("visualize/narr_02.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(14.5 * fps)}>
        <Audio src={staticFile("visualize/narr_03.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(23.5 * fps)}>
        <Audio src={staticFile("visualize/narr_04.wav")} volume={1} />
      </Sequence>
    </div>
  );
};
