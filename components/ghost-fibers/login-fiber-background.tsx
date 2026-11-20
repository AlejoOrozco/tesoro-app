"use client";

import GhostFibers from "./ghost-fibers";

const GOLD_300 = "#d9aa00";
const GOLD_200 = "#efcc70";
const GOLD_100 = "#fae6b6";

export function LoginFiberBackground() {
  return (
    <GhostFibers
      glowColor={GOLD_300}
      lineColor={GOLD_100}
      secondaryColor={GOLD_200}
      gradient="along"
      layers={2}
      waves={0.8}
      twist={0.5}
      volume={0.5}
      spread={1}
      scale={1}
      rotation={18}
      perspective={0.65}
      fiberStyle="lines"
      threads={96}
      density={1}
      thickness={1.35}
      tips={1}
      foldGlow={2}
      speed={0.5}
      flow={0.25}
      rollSpeed={0.15}
      depthOfField={0}
      focusDepth={0}
      particles={0.5}
      sparkle={0.3}
      glow={1.2}
      brightness={1.15}
      vignette={0.3}
      grain={0.06}
      hoverEffect="none"
      mouseInteraction={false}
      pulseOnClick
      intro
      lightMode={false}
    />
  );
}
