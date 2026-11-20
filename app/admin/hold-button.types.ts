import type { CSSProperties, ReactNode } from "react";

export type HoldButtonSize = "sm" | "md" | "lg";
export type HoldButtonDirection = "right" | "up";

export interface HoldButtonProps {
  children?: ReactNode;
  doneLabel?: ReactNode;
  icon?: ReactNode;
  doneIcon?: ReactNode;
  backgroundColor?: string;
  fillColor?: string;
  textColor?: string;
  fillTextColor?: string;
  size?: HoldButtonSize;
  radius?: number;
  fillDirection?: HoldButtonDirection;
  holdTime?: number;
  releaseTime?: number;
  pressScale?: number;
  wave?: boolean;
  waveAmplitude?: number;
  glow?: boolean;
  resetAfter?: number;
  disabled?: boolean;
  onHold?: () => void;
  onTap?: () => void;
  className?: string;
}

export type HoldPhase = "idle" | "holding" | "done";
export type HoldInput = "pointer" | "key" | null;

export interface HoldMotion {
  raf: number;
  p: number;
  from: number;
  to: number;
  start: number;
}

export interface HoldGesture {
  pointerId: number | null;
  start: number;
  rect: DOMRect | null;
}

export interface HoldReleaseOptions {
  drifted?: boolean;
}

export interface HoldButtonStyle extends CSSProperties {
  "--hb-radius": string;
  "--hb-bg": string;
  "--hb-fill": string;
  "--hb-text": string;
  "--hb-fill-text": string;
  "--hb-hold": string;
  "--hb-cycles": number;
  "--hb-release": string;
  "--hb-press": number;
  "--hb-wave": string;
}
