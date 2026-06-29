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
    end: 5.7,
    line1: "Switch between AI agents instantly —",
    line2: "right from the Dynamic Island.",
  },
  {
    start: 7,
    end: 12.1,
    line1: "Grab the Screen Doodle tool and sketch",
    line2: "anything, anywhere on your screen.",
  },
  {
    start: 15,
    end: 20.5,
    line1: "Your doodle is captured automatically",
    line2: "and sent straight to the AI for analysis.",
  },
  {
    start: 25,
    end: 32.2,
    line1: "From sketch to insight, in seconds.",
    line2: "Enconvo — your AI productivity assistant.",
  },
];

export const VIDEO_SECONDS = 37.6;
export const LOGO_SECONDS = 5;
export const TOTAL_SECONDS = VIDEO_SECONDS + LOGO_SECONDS;

export const DoodlePromo: React.FC = () => {
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
            src={staticFile("doodle/source.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
          <SubtitleBar time={time} subtitles={SUBTITLES} />
        </div>
      )}

      {isLogoPhase && <LogoCard startFrame={logoStartFrame} />}

      <Sequence from={Math.round(0.5 * fps)}>
        <Audio src={staticFile("doodle/narr_01.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(7 * fps)}>
        <Audio src={staticFile("doodle/narr_02.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(15 * fps)}>
        <Audio src={staticFile("doodle/narr_03.wav")} volume={1} />
      </Sequence>
      <Sequence from={Math.round(25 * fps)}>
        <Audio src={staticFile("doodle/narr_04.wav")} volume={1} />
      </Sequence>
    </div>
  );
};
