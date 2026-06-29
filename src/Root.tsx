import React from "react";
import { Composition } from "remotion";
import {
  DoodlePromo,
  TOTAL_SECONDS as DOODLE_TOTAL,
} from "./features/doodle";
import {
  VisualizePromo,
  TOTAL_SECONDS as VISUALIZE_TOTAL,
} from "./features/visualize";

const FPS = 60;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DoodlePromo"
        component={DoodlePromo}
        durationInFrames={Math.round(DOODLE_TOTAL * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="VisualizePromo"
        component={VisualizePromo}
        durationInFrames={Math.round(VISUALIZE_TOTAL * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
