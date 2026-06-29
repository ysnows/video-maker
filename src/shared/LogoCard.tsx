import React from "react";
import { useCurrentFrame, staticFile, Img, interpolate } from "remotion";

export const LogoCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - startFrame);

  const logoOpacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(local, [0, 20], [0.85, 1], {
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(local, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#1a1a1c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          '-apple-system, "system-ui", "SF Pro Text", "Segoe UI", system-ui, sans-serif',
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 180,
          height: 180,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      />
      <div
        style={{
          marginTop: 28,
          fontSize: 48,
          fontWeight: 600,
          color: "rgba(250,250,250,0.92)",
          letterSpacing: -0.5,
          opacity: textOpacity,
        }}
      >
        Enconvo
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 20,
          color: "rgba(161,161,170,0.7)",
          fontWeight: 400,
          opacity: textOpacity,
        }}
      >
        Your AI-Powered Productivity Assistant
      </div>
    </div>
  );
};
