import React from "react";
import { Composition } from "remotion";
import { DANG4_DEFAULT, D4Props, Dang4Mono } from "./Dang4Mono";

export const Dang4Root: React.FC = () => (
  <Composition
    id="dang4"
    component={Dang4Mono as unknown as React.FC<Record<string, unknown>>}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={Math.round(DANG4_DEFAULT.durationSec * 30)}
    defaultProps={DANG4_DEFAULT as unknown as Record<string, unknown>}
    calculateMetadata={async ({ props }) => {
      const p = { ...DANG4_DEFAULT, ...(props as Partial<D4Props>) };
      const fps = p.fps ?? 30;
      return { durationInFrames: Math.max(1, Math.round(p.durationSec * fps)), fps };
    }}
  />
);
